"""
HelioAlert - NASA OMNI2 Parser and Data Ingestion Module
Accurately maps NASA SPDF OMNI2 hourly ascii columns and fill values to standard physical units.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
import os
import glob
import pandas as pd
import numpy as np

FILL_VALUES = {
    'bt': 999.9,
    'bz_gsm': 999.9,
    'proton_density': 999.9,
    'flow_speed': 9999.0,
    'pressure': 99.99,
    'electric_field': 999.99,
    'kp_raw': 99,
    'sunspot_number': 999,
    'dst': 99999,
    'f107': 999.9
}

def parse_omni2_line(line: str) -> Optional[Dict[str, Any]]:
    tokens = line.strip().split()
    if len(tokens) < 51:
        return None
    
    try:
        year = int(tokens[0])
        doy = int(tokens[1])
        hour = int(tokens[2])
        # Compute UTC datetime
        dt = datetime(year, 1, 1, tzinfo=timezone.utc) + timedelta(days=doy - 1, hours=hour)
        iso_time = dt.isoformat()
        
        # Parse fields with fill value checks
        def clean_float(val_str: str, fill: float) -> Optional[float]:
            val = float(val_str)
            if abs(val - fill) < 1e-3 or val >= fill:
                return None
            return val

        def clean_int(val_str: str, fill: int) -> Optional[int]:
            val = int(val_str)
            if val == fill:
                return None
            return val

        bt = clean_float(tokens[8], FILL_VALUES['bt'])
        bz_gsm = clean_float(tokens[16], FILL_VALUES['bz_gsm'])
        proton_density = clean_float(tokens[23], FILL_VALUES['proton_density'])
        flow_speed = clean_float(tokens[24], FILL_VALUES['flow_speed'])
        pressure = clean_float(tokens[28], FILL_VALUES['pressure'])
        electric_field = clean_float(tokens[35], FILL_VALUES['electric_field'])
        
        raw_kp = clean_int(tokens[38], FILL_VALUES['kp_raw'])
        kp = round(raw_kp / 10.0, 2) if raw_kp is not None else None
        
        sunspot_number = clean_int(tokens[39], FILL_VALUES['sunspot_number'])
        dst = clean_int(tokens[40], FILL_VALUES['dst'])
        f107 = clean_float(tokens[50], FILL_VALUES['f107'])
        
        return {
            'timestamp': dt,
            'time_tag': iso_time,
            'year': year,
            'doy': doy,
            'hour': hour,
            'bt': bt,
            'bz_gsm': bz_gsm,
            'proton_density': proton_density,
            'flow_speed': flow_speed,
            'pressure': pressure,
            'electric_field': electric_field,
            'kp': kp,
            'sunspot_number': sunspot_number,
            'dst': dst,
            'f107': f107
        }
    except Exception:
        return None

def load_omni2_directory(data_dir: str) -> pd.DataFrame:
    files = sorted(glob.glob(os.path.join(data_dir, 'omni2_*.dat')))
    records = []
    for fpath in files:
        with open(fpath, 'r', encoding='ascii') as f:
            for line in f:
                rec = parse_omni2_line(line)
                if rec:
                    records.append(rec)
    
    df = pd.DataFrame(records)
    if not df.empty:
        # Sort chronologically and drop duplicates on timestamp
        df = df.sort_values('timestamp').drop_duplicates(subset=['timestamp']).reset_index(drop=True)
    return df

