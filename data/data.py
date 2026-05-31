import os
import shutil
from kaggle.api.kaggle_api_extended import KaggleApi

# 1. Inicializar y autenticar la API oficial de Kaggle
api = KaggleApi()
api.authenticate()

# 2. Configurar rutas de origen (temporal) y destino final
# Usamos una carpeta temporal 'temp_kaggle' para recibir la descarga
temp_dir = "./temp_kaggle"
destino_final = "./raw/superstore_crudo.csv"

# Crear los directorios si no existen para evitar errores de ruta
os.makedirs(temp_dir, exist_ok=True)
os.makedirs(os.path.dirname(destino_final), exist_ok=True)

print("Descargando dataset desde Kaggle...")
# Descarga y descomprime automáticamente el archivo en la carpeta temporal
api.dataset_download_files("vivek468/superstore-dataset-final", path=temp_dir, unzip=True)

# 3. Mover y renombrar el CSV a tu carpeta de datos crudos
# La API descarga el archivo con su nombre original: "Sample - Superstore.csv"
origen_csv = os.path.join(temp_dir, "Sample - Superstore.csv")

if os.path.exists(origen_csv):
    # Mueve y renombra el archivo al mismo tiempo
    shutil.move(origen_csv, destino_final)
    print(f"¡Dataset listo para React + TS en: {destino_final}!")
    
    # Limpieza: Borramos la carpeta temporal para mantener el proyecto limpio
    shutil.rmtree(temp_dir)
else:
    print("Error: No se encontró el archivo 'Sample - Superstore.csv' en la descarga.")
    