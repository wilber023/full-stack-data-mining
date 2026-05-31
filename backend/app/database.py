"""
database.py — Capa de datos: DuckDB Star-Schema Warehouse
=========================================================
Implementa un modelo dimensional (esquema estrella) sobre DuckDB con:
- dim_customer: datos del cliente y segmento
- dim_product:  categoría, sub-categoría, nombre
- dim_geography: ciudad, estado, código postal, región, país
- dim_date:     fecha completa, año, mes, trimestre, día de la semana
- fact_sales:   tabla de hechos con métricas (sales, quantity, discount, profit)

El warehouse se guarda en data/superstore_warehouse.duckdb
"""

import os
import duckdb
import pandas as pd
from pathlib import Path

# ── Rutas ──────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent        # raíz del proyecto
DATA_DIR = BASE_DIR / "data"
RAW_CSV  = DATA_DIR / "raw" / "superstore_crudo.csv"
DB_PATH  = DATA_DIR / "superstore_warehouse.duckdb"


# ── Conexión ───────────────────────────────────────────────────────────────────
def get_connection(read_only: bool = False) -> duckdb.DuckDBPyConnection:
    """Retorna una conexión al warehouse DuckDB."""
    os.makedirs(DATA_DIR, exist_ok=True)
    return duckdb.connect(str(DB_PATH), read_only=read_only)


# ── Creación del warehouse ─────────────────────────────────────────────────────
def init_warehouse(csv_path: str | None = None) -> None:
    """
    Lee el CSV crudo, construye las dimensiones y la tabla de hechos.
    Puede llamarse desde el notebook o desde el backend al iniciar.
    """
    csv_path = csv_path or str(RAW_CSV)
    df = pd.read_csv(csv_path, encoding="latin-1")

    # ── Limpieza básica ────────────────────────────────────────────────────
    df.columns = [c.strip().replace(" ", "_") for c in df.columns]
    df["Order_Date"] = pd.to_datetime(df["Order_Date"], format="mixed", dayfirst=False)
    df["Ship_Date"]  = pd.to_datetime(df["Ship_Date"],  format="mixed", dayfirst=False)

    # ── Dimensión: Customer ────────────────────────────────────────────────
    dim_customer = (
        df[["Customer_ID", "Customer_Name", "Segment"]]
        .drop_duplicates()
        .reset_index(drop=True)
    )
    dim_customer.index.name = "customer_key"
    dim_customer = dim_customer.reset_index()

    # ── Dimensión: Product ─────────────────────────────────────────────────
    dim_product = (
        df[["Product_ID", "Category", "Sub-Category", "Product_Name"]]
        .drop_duplicates()
        .reset_index(drop=True)
    )
    dim_product.columns = ["product_id", "category", "sub_category", "product_name"]
    dim_product.index.name = "product_key"
    dim_product = dim_product.reset_index()

    # ── Dimensión: Geography ───────────────────────────────────────────────
    dim_geography = (
        df[["City", "State", "Postal_Code", "Region", "Country"]]
        .drop_duplicates()
        .reset_index(drop=True)
    )
    dim_geography.columns = ["city", "state", "postal_code", "region", "country"]
    dim_geography.index.name = "geo_key"
    dim_geography = dim_geography.reset_index()

    # ── Dimensión: Date ────────────────────────────────────────────────────
    all_dates = pd.concat([df["Order_Date"], df["Ship_Date"]]).drop_duplicates().sort_values()
    dim_date = pd.DataFrame({
        "full_date":   all_dates.values,
        "year":        all_dates.dt.year.values,
        "month":       all_dates.dt.month.values,
        "quarter":     all_dates.dt.quarter.values,
        "day_of_week": all_dates.dt.dayofweek.values,
        "month_name":  all_dates.dt.month_name().values,
    })
    dim_date = dim_date.reset_index(drop=True)
    dim_date.index.name = "date_key"
    dim_date = dim_date.reset_index()

    # ── Tabla de hechos ────────────────────────────────────────────────────
    # Mapear surrogate keys usando merge para manejar duplicados
    # Customer key: un Customer_ID puede tener un solo registro en dim
    cust_lookup = dim_customer.drop_duplicates(subset=["Customer_ID"])[["Customer_ID", "customer_key"]]
    prod_lookup = dim_product.drop_duplicates(subset=["product_id"])[["product_id", "product_key"]]

    # Geography key: merge por las 5 columnas
    geo_cols_upper = ["City", "State", "Postal_Code", "Region", "Country"]
    geo_cols_lower = ["city", "state", "postal_code", "region", "country"]

    # Date key: usar merge por fecha
    date_lookup = dim_date[["full_date", "date_key"]].copy()

    # Construir fact table con merge
    fact = df[["Order_ID", "Customer_ID", "Product_ID", "City", "State",
               "Postal_Code", "Region", "Country", "Order_Date", "Ship_Date",
               "Ship_Mode", "Sales", "Quantity", "Discount", "Profit"]].copy()
    fact.columns = ["order_id", "Customer_ID", "product_id", "city", "state",
                    "postal_code", "region", "country", "order_date", "ship_date",
                    "ship_mode", "sales", "quantity", "discount", "profit"]

    fact = fact.merge(cust_lookup, on="Customer_ID", how="left")
    fact = fact.merge(prod_lookup, on="product_id", how="left")
    fact = fact.merge(dim_geography[["geo_key"] + geo_cols_lower], on=geo_cols_lower, how="left")
    fact = fact.merge(date_lookup.rename(columns={"full_date": "order_date"}),
                      on="order_date", how="left").rename(columns={"date_key": "date_key"})
    fact = fact.merge(date_lookup.rename(columns={"full_date": "ship_date", "date_key": "ship_date_key"}),
                      on="ship_date", how="left")

    fact["is_profitable"] = (fact["profit"] > 0).astype(int)

    # Conservar solo columnas del esquema estrella
    fact = fact[["order_id", "customer_key", "product_key", "geo_key", "date_key",
                 "ship_date_key", "ship_mode", "sales", "quantity", "discount",
                 "profit", "is_profitable"]]

    # ── Persistir en DuckDB ────────────────────────────────────────────────
    con = get_connection()
    try:
        con.execute("DROP TABLE IF EXISTS fact_sales")
        con.execute("DROP TABLE IF EXISTS dim_customer")
        con.execute("DROP TABLE IF EXISTS dim_product")
        con.execute("DROP TABLE IF EXISTS dim_geography")
        con.execute("DROP TABLE IF EXISTS dim_date")

        con.execute("CREATE TABLE dim_customer  AS SELECT * FROM dim_customer")
        con.execute("CREATE TABLE dim_product   AS SELECT * FROM dim_product")
        con.execute("CREATE TABLE dim_geography AS SELECT * FROM dim_geography")
        con.execute("CREATE TABLE dim_date      AS SELECT * FROM dim_date")
        con.execute("CREATE TABLE fact_sales     AS SELECT * FROM fact")
        print(f"[OK] Warehouse creado en {DB_PATH}")
        print(f"   fact_sales: {len(fact)} filas")
        print(f"   dim_customer: {len(dim_customer)} filas")
        print(f"   dim_product: {len(dim_product)} filas")
        print(f"   dim_geography: {len(dim_geography)} filas")
        print(f"   dim_date: {len(dim_date)} filas")
    finally:
        con.close()


# ── Consultas OLAP ─────────────────────────────────────────────────────────────

def olap_sales_by_category() -> list[dict]:
    """Ventas y profit agregados por categoría de producto."""
    con = get_connection(read_only=True)
    try:
        result = con.execute("""
            SELECT
                p.category,
                ROUND(SUM(f.sales), 2)    AS total_sales,
                ROUND(SUM(f.profit), 2)   AS total_profit,
                SUM(f.quantity)            AS total_quantity,
                COUNT(*)                   AS order_count,
                ROUND(AVG(f.discount), 3) AS avg_discount
            FROM fact_sales f
            JOIN dim_product p ON f.product_key = p.product_key
            GROUP BY p.category
            ORDER BY total_sales DESC
        """).fetchdf()
        return result.to_dict(orient="records")
    finally:
        con.close()


def olap_sales_by_region() -> list[dict]:
    """Ventas y profit por región geográfica."""
    con = get_connection(read_only=True)
    try:
        result = con.execute("""
            SELECT
                g.region,
                ROUND(SUM(f.sales), 2)  AS total_sales,
                ROUND(SUM(f.profit), 2) AS total_profit,
                COUNT(*)                AS order_count,
                ROUND(AVG(f.profit), 2) AS avg_profit_per_order
            FROM fact_sales f
            JOIN dim_geography g ON f.geo_key = g.geo_key
            GROUP BY g.region
            ORDER BY total_sales DESC
        """).fetchdf()
        return result.to_dict(orient="records")
    finally:
        con.close()


def olap_monthly_trend() -> list[dict]:
    """Tendencia mensual de ventas y profit."""
    con = get_connection(read_only=True)
    try:
        result = con.execute("""
            SELECT
                d.year,
                d.month,
                d.month_name,
                ROUND(SUM(f.sales), 2)  AS total_sales,
                ROUND(SUM(f.profit), 2) AS total_profit,
                COUNT(*)                AS order_count
            FROM fact_sales f
            JOIN dim_date d ON f.date_key = d.date_key
            GROUP BY d.year, d.month, d.month_name
            ORDER BY d.year, d.month
        """).fetchdf()
        return result.to_dict(orient="records")
    finally:
        con.close()


def olap_profit_by_segment() -> list[dict]:
    """Profit y ventas por segmento de cliente."""
    con = get_connection(read_only=True)
    try:
        result = con.execute("""
            SELECT
                c.Segment AS segment,
                ROUND(SUM(f.sales), 2)  AS total_sales,
                ROUND(SUM(f.profit), 2) AS total_profit,
                COUNT(DISTINCT c.Customer_ID) AS unique_customers,
                COUNT(*)                AS order_count
            FROM fact_sales f
            JOIN dim_customer c ON f.customer_key = c.customer_key
            GROUP BY c.Segment
            ORDER BY total_profit DESC
        """).fetchdf()
        return result.to_dict(orient="records")
    finally:
        con.close()


def olap_top_products(limit: int = 15) -> list[dict]:
    """Top N productos por ventas totales."""
    con = get_connection(read_only=True)
    try:
        result = con.execute(f"""
            SELECT
                p.product_name,
                p.category,
                p.sub_category,
                ROUND(SUM(f.sales), 2)  AS total_sales,
                ROUND(SUM(f.profit), 2) AS total_profit,
                SUM(f.quantity)          AS total_quantity
            FROM fact_sales f
            JOIN dim_product p ON f.product_key = p.product_key
            GROUP BY p.product_name, p.category, p.sub_category
            ORDER BY total_sales DESC
            LIMIT {limit}
        """).fetchdf()
        return result.to_dict(orient="records")
    finally:
        con.close()


def olap_discount_impact() -> list[dict]:
    """Impacto del descuento en el profit — agrupado por nivel de descuento."""
    con = get_connection(read_only=True)
    try:
        result = con.execute("""
            SELECT
                f.discount,
                ROUND(AVG(f.profit), 2)  AS avg_profit,
                ROUND(AVG(f.sales), 2)   AS avg_sales,
                COUNT(*)                 AS order_count,
                ROUND(SUM(CASE WHEN f.is_profitable = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS pct_profitable
            FROM fact_sales f
            GROUP BY f.discount
            ORDER BY f.discount
        """).fetchdf()
        return result.to_dict(orient="records")
    finally:
        con.close()


def olap_subcategory_analysis() -> list[dict]:
    """Análisis por sub-categoría: ventas, profit y margen."""
    con = get_connection(read_only=True)
    try:
        result = con.execute("""
            SELECT
                p.sub_category,
                p.category,
                ROUND(SUM(f.sales), 2)  AS total_sales,
                ROUND(SUM(f.profit), 2) AS total_profit,
                ROUND(SUM(f.profit) / NULLIF(SUM(f.sales), 0) * 100, 2) AS profit_margin_pct,
                COUNT(*) AS order_count
            FROM fact_sales f
            JOIN dim_product p ON f.product_key = p.product_key
            GROUP BY p.sub_category, p.category
            ORDER BY total_sales DESC
        """).fetchdf()
        return result.to_dict(orient="records")
    finally:
        con.close()


# ── Punto de entrada directo ───────────────────────────────────────────────────
if __name__ == "__main__":
    init_warehouse()
