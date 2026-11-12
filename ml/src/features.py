"""
HelioAlert - Feature Engineering & Target Extraction
Calculates strictly pre-observation features and multi-horizon future storm targets (Kp >= 5.0).
Zero data leakage: all features use data at or before time t; targets use data strictly from t+1 to t+H.
"""
from typing import Tuple, List
import pandas as pd
import numpy as np

FEATURE_NAMES = [
    'flow_speed',
    'speed_mean_3h',
    'speed_mean_6h',
    'speed_std_6h',
    'proton_density',
    'density_mean_3h',
    'density_mean_6h',
    'bz_gsm',
    'bz_mean_3h',
    'bz_mean_6h',
    'bz_mean_12h',
    'bz_min_3h',
    'bz_min_6h',
    'bz_min_12h',
    'southward_hours_6h',
    'bt',
    'pressure',
    'electric_field',
    'kp_recent'
]

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes rolling lag features for solar wind telemetry.
    Ensures strict chronological ordering and forward fills short telemetry gaps.
    """
    df = df.sort_values('timestamp').copy()
    
    # Impute small gaps (up to 3 consecutive hours) for continuous rolling window calculation
    interp_cols = ['flow_speed', 'proton_density', 'bz_gsm', 'bt', 'pressure', 'electric_field', 'kp']
    for col in interp_cols:
        if col in df.columns:
            df[col] = df[col].ffill(limit=3)
            
    # Solar wind speed rolling features
    df['speed_mean_3h'] = df['flow_speed'].rolling(window=3, min_periods=2).mean()
    df['speed_mean_6h'] = df['flow_speed'].rolling(window=6, min_periods=3).mean()
    df['speed_std_6h'] = df['flow_speed'].rolling(window=6, min_periods=3).std().fillna(0.0)
    
    # Proton density rolling features
    df['density_mean_3h'] = df['proton_density'].rolling(window=3, min_periods=2).mean()
    df['density_mean_6h'] = df['proton_density'].rolling(window=6, min_periods=3).mean()
    
    # IMF Bz rolling features (critical southward reconnection drivers)
    df['bz_mean_3h'] = df['bz_gsm'].rolling(window=3, min_periods=2).mean()
    df['bz_mean_6h'] = df['bz_gsm'].rolling(window=6, min_periods=3).mean()
    df['bz_mean_12h'] = df['bz_gsm'].rolling(window=12, min_periods=6).mean()
    
    df['bz_min_3h'] = df['bz_gsm'].rolling(window=3, min_periods=2).min()
    df['bz_min_6h'] = df['bz_gsm'].rolling(window=6, min_periods=3).min()
    df['bz_min_12h'] = df['bz_gsm'].rolling(window=12, min_periods=6).min()
    
    # Hours of southward Bz (Bz < 0) over the last 6 hours
    df['is_southward'] = (df['bz_gsm'] < 0).astype(float)
    df['southward_hours_6h'] = df['is_southward'].rolling(window=6, min_periods=3).sum()
    
    # Recent Kp observation
    df['kp_recent'] = df['kp']
    
    # Formulate future targets across multiple forecasting horizons (3h, 6h, 12h, 24h)
    # Target at index i is 1 if any Kp in [i+1, i+H] >= 5.0 (NOAA G1 minor storm threshold)
    for h in [3, 6, 12, 24]:
        # Reverse shift rolling max to look strictly into the future
        # df['kp'].iloc[::-1].rolling(h).max().iloc[::-1].shift(-1)
        future_kp_max = (
            df['kp']
            .iloc[::-1]
            .rolling(window=h, min_periods=1)
            .max()
            .iloc[::-1]
            .shift(-1)
        )
        df[f'target_{h}h'] = (future_kp_max >= 5.0).astype(float)
        # Where future Kp is completely missing, target is NaN
        df.loc[future_kp_max.isna(), f'target_{h}h'] = np.nan
        
    return df

def extract_dataset(df: pd.DataFrame, horizon_hours: int = 3) -> Tuple[pd.DataFrame, pd.Series, List[str]]:
    """
    Extracts complete clean feature matrix X and target y for the specified forecast horizon.
    """
    target_col = f'target_{horizon_hours}h'
    req_cols = FEATURE_NAMES + [target_col, 'time_tag', 'year', 'timestamp']
    
    clean_sub = df.dropna(subset=FEATURE_NAMES + [target_col]).copy()
    
    X = clean_sub[FEATURE_NAMES]
    y = clean_sub[target_col].astype(int)
    
    return X, y, FEATURE_NAMES

