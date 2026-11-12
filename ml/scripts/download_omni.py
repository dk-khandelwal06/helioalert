"""
HelioAlert - NASA OMNI2 Data Downloader
Downloads hourly OMNI2 datasets directly from NASA SPDF.
"""
import os
import sys
import urllib.request
import time

RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'raw')
BASE_URL = "https://spdf.gsfc.nasa.gov/pub/data/omni/low_res_omni"

# Years spanning Solar Cycle 24 quiet phase to Solar Cycle 25 maximum (including May 2024 G5 event)
YEARS = list(range(2018, 2025))

def download_omni2_files():
    os.makedirs(RAW_DATA_DIR, exist_ok=True)
    print(f"[INFO] Target raw data directory: {os.path.abspath(RAW_DATA_DIR)}")
    
    for yr in YEARS:
        filename = f"omni2_{yr}.dat"
        dest_path = os.path.join(RAW_DATA_DIR, filename)
        url = f"{BASE_URL}/{filename}"
        
        if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1_000_000:
            print(f"[INFO] {filename} already exists ({os.path.getsize(dest_path)} bytes). Skipping download.")
            continue
            
        print(f"[INFO] Downloading {filename} from {url}...")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HelioAlert/1.0'})
            with urllib.request.urlopen(req, timeout=30) as resp, open(dest_path, 'wb') as out_f:
                content = resp.read()
                out_f.write(content)
            print(f"[SUCCESS] Downloaded {filename} ({len(content)} bytes)")
            time.sleep(0.5)
        except Exception as e:
            print(f"[ERROR] Failed to download {filename}: {e}", file=sys.stderr)

if __name__ == "__main__":
    download_omni2_files()

