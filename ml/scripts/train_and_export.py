"""
HelioAlert - Machine Learning Training, Evaluation & Model Export Pipeline
Trains multi-horizon space weather classifiers on NASA OMNI2 hourly data, computes baselines,
evaluates on held-out test data (2024), and exports production JSON artifacts for TypeScript inference.
"""
import os
import sys

# Ensure repository root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

import json
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    average_precision_score, roc_auc_score,
    confusion_matrix, precision_recall_curve, roc_curve
)

from ml.src.omni_parser import load_omni2_directory
from ml.src.features import engineer_features, FEATURE_NAMES
from ml.src.database import get_connection, init_db, save_observations_to_db, seed_historical_events

RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'raw')
MODEL_ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'artifacts', 'model')
METRICS_ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'artifacts', 'metrics')

def run_pipeline():
    os.makedirs(MODEL_ARTIFACTS_DIR, exist_ok=True)
    os.makedirs(METRICS_ARTIFACTS_DIR, exist_ok=True)
    
    print("[1/5] Ingesting and parsing NASA OMNI2 hourly data...")
    raw_df = load_omni2_directory(RAW_DATA_DIR)
    print(f"      Total records loaded: {len(raw_df)} ({raw_df['time_tag'].min()} to {raw_df['time_tag'].max()})")
    
    print("[2/5] Initializing SQLite database and saving observations...")
    db_conn = get_connection()
    init_db(db_conn)
    save_observations_to_db(raw_df, db_conn)
    seed_historical_events(db_conn)
    
    print("[3/5] Engineering lag/rolling features and multi-horizon future targets...")
    feat_df = engineer_features(raw_df)
    
    # Chronological partition
    train_mask = (feat_df['year'] >= 2018) & (feat_df['year'] <= 2021)
    val_mask   = (feat_df['year'] >= 2022) & (feat_df['year'] <= 2023)
    test_mask  = (feat_df['year'] == 2024)
    
    print(f"      Train rows (2018-2021): {train_mask.sum()}")
    print(f"      Val rows (2022-2023):   {val_mask.sum()}")
    print(f"      Test rows (2024):       {test_mask.sum()} (Held-out, includes May 2024 G5 storm)")
    
    all_metrics = {
        'horizons': {},
        'baselines': {},
        'feature_names': FEATURE_NAMES,
        'dataset_summary': {
            'total_hours': len(raw_df),
            'start_date': raw_df['time_tag'].min(),
            'end_date': raw_df['time_tag'].max(),
            'train_years': '2018-2021',
            'val_years': '2022-2023',
            'test_years': '2024'
        }
    }
    
    horizons = [3, 6, 12, 24]
    
    for h in horizons:
        print(f"\n--- Processing Horizon: {h} Hours ---")
        target_col = f'target_{h}h'
        
        # Filter valid rows
        sub = feat_df.dropna(subset=FEATURE_NAMES + [target_col]).copy()
        
        train_sub = sub[(sub['year'] >= 2018) & (sub['year'] <= 2021)]
        val_sub   = sub[(sub['year'] >= 2022) & (sub['year'] <= 2023)]
        test_sub  = sub[(sub['year'] == 2024)]
        
        X_train, y_train = train_sub[FEATURE_NAMES].values, train_sub[target_col].values.astype(int)
        X_val, y_val     = val_sub[FEATURE_NAMES].values, val_sub[target_col].values.astype(int)
        X_test, y_test   = test_sub[FEATURE_NAMES].values, test_sub[target_col].values.astype(int)
        
        storm_freq_train = float(np.mean(y_train))
        storm_freq_val   = float(np.mean(y_val))
        storm_freq_test  = float(np.mean(y_test))
        print(f"    Positive Class Rate (Storms): Train={storm_freq_train*100:.2f}%, Val={storm_freq_val*100:.2f}%, Test={storm_freq_test*100:.2f}%")
        
        # Scaling
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_val_scaled   = scaler.transform(X_val)
        X_test_scaled  = scaler.transform(X_test)
        
        # Primary Model: Class-Weighted Logistic Regression
        lr = LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42)
        lr.fit(X_train_scaled, y_train)
        
        # Val predictions for threshold search
        val_probs = lr.predict_proba(X_val_scaled)[:, 1]
        
        # Search optimal threshold on Validation set (maximize F1 score)
        candidate_thresholds = np.linspace(0.1, 0.9, 81)
        best_thresh = 0.5
        best_f1 = -1.0
        for th in candidate_thresholds:
            preds = (val_probs >= th).astype(int)
            f1 = f1_score(y_val, preds, zero_division=0)
            if f1 > best_f1:
                best_f1 = f1
                best_thresh = th
        
        best_thresh = round(float(best_thresh), 3)
        print(f"    Validation Optimal Threshold (max F1={best_f1:.4f}): {best_thresh}")
        
        # Test evaluation with selected threshold
        test_probs = lr.predict_proba(X_test_scaled)[:, 1]
        test_preds = (test_probs >= best_thresh).astype(int)
        
        # Compute metrics
        tn, fp, fn, tp = confusion_matrix(y_test, test_preds).ravel()
        tpr = tp / (tp + fn) if (tp + fn) > 0 else 0.0 # Recall
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0 # False alarm rate
        precision = precision_score(y_test, test_preds, zero_division=0)
        recall = recall_score(y_test, test_preds, zero_division=0)
        f1 = f1_score(y_test, test_preds, zero_division=0)
        pr_auc = average_precision_score(y_test, test_probs)
        roc_auc = roc_auc_score(y_test, test_probs)
        tss = float(tpr - fpr) # True Skill Statistic
        
        # Precision-Recall Curve points
        prec_arr, rec_arr, _ = precision_recall_curve(y_test, test_probs)
        pr_curve = [{'recall': round(float(r), 4), 'precision': round(float(p), 4)} 
                    for p, r in zip(prec_arr[::max(1, len(prec_arr)//40)], rec_arr[::max(1, len(rec_arr)//40)])]
        
        # ROC Curve points
        fpr_arr, tpr_arr, _ = roc_curve(y_test, test_probs)
        roc_curve_data = [{'fpr': round(float(f), 4), 'tpr': round(float(t), 4)} 
                          for f, t in zip(fpr_arr[::max(1, len(fpr_arr)//40)], tpr_arr[::max(1, len(tpr_arr)//40)])]
        
        # Baseline Evaluations on Test Set
        # Baseline 1: Always predict no storm (0)
        b_no_storm_preds = np.zeros_like(y_test)
        b_no_storm_acc = float(np.mean(b_no_storm_preds == y_test))
        
        # Baseline 2: Persistence (predict 1 if current Kp >= 5.0)
        kp_recent_idx = FEATURE_NAMES.index('kp_recent')
        b_persist_preds = (X_test[:, kp_recent_idx] >= 5.0).astype(int)
        b_persist_prec = precision_score(y_test, b_persist_preds, zero_division=0)
        b_persist_rec = recall_score(y_test, b_persist_preds, zero_division=0)
        b_persist_f1 = f1_score(y_test, b_persist_preds, zero_division=0)
        b_persist_tn, b_persist_fp, b_persist_fn, b_persist_tp = confusion_matrix(y_test, b_persist_preds).ravel()
        b_persist_tss = float((b_persist_tp/(b_persist_tp+b_persist_fn)) - (b_persist_fp/(b_persist_fp+b_persist_tn)))
        
        # Comparison Model: HistGradientBoosting
        hgb = HistGradientBoostingClassifier(random_state=42, class_weight='balanced')
        hgb.fit(X_train, y_train)
        hgb_probs = hgb.predict_proba(X_test)[:, 1]
        hgb_pr_auc = average_precision_score(y_test, hgb_probs)
        hgb_roc_auc = roc_auc_score(y_test, hgb_probs)
        
        # Feature weights (coefficients)
        weights = {feat: round(float(coef), 4) for feat, coef in zip(FEATURE_NAMES, lr.coef_[0])}
        
        horizon_metrics = {
            'horizon_hours': h,
            'optimal_threshold': best_thresh,
            'test_sample_count': len(y_test),
            'positive_test_count': int(np.sum(y_test)),
            'positive_rate': round(storm_freq_test, 4),
            'confusion_matrix': {
                'true_negative': int(tn),
                'false_positive': int(fp),
                'false_negative': int(fn),
                'true_positive': int(tp)
            },
            'precision': round(float(precision), 4),
            'recall': round(float(recall), 4),
            'f1_score': round(float(f1), 4),
            'pr_auc': round(float(pr_auc), 4),
            'roc_auc': round(float(roc_auc), 4),
            'tss': round(tss, 4),
            'false_alarm_rate': round(float(fpr), 4),
            'pr_curve': pr_curve,
            'roc_curve': roc_curve_data,
            'feature_weights': weights,
            'baselines': {
                'always_no_storm': {
                    'accuracy': round(b_no_storm_acc, 4),
                    'recall': 0.0,
                    'precision': 0.0,
                    'f1': 0.0
                },
                'persistence': {
                    'precision': round(float(b_persist_prec), 4),
                    'recall': round(float(b_persist_rec), 4),
                    'f1': round(float(b_persist_f1), 4),
                    'tss': round(b_persist_tss, 4)
                },
                'hist_gradient_boosting': {
                    'pr_auc': round(float(hgb_pr_auc), 4),
                    'roc_auc': round(float(hgb_roc_auc), 4)
                }
            }
        }
        
        all_metrics['horizons'][f'{h}h'] = horizon_metrics
        
        # Export Model Parameter Artifact for Production Server-Side TypeScript Inference
        model_export = {
            'model_name': 'HelioAlert-LogisticRegression',
            'version': '1.0.0',
            'horizon_hours': h,
            'algorithm': 'LogisticRegression',
            'class_weight': 'balanced',
            'optimal_threshold': best_thresh,
            'features': FEATURE_NAMES,
            'coefficients': [round(float(c), 6) for c in lr.coef_[0]],
            'intercept': round(float(lr.intercept_[0]), 6),
            'scaler': {
                'mean': [round(float(m), 6) for m in scaler.mean_],
                'scale': [round(float(s), 6) for s in scaler.scale_]
            },
            'metrics_summary': {
                'precision': round(float(precision), 4),
                'recall': round(float(recall), 4),
                'f1_score': round(float(f1), 4),
                'pr_auc': round(float(pr_auc), 4),
                'roc_auc': round(float(roc_auc), 4),
                'tss': round(tss, 4)
            }
        }
        
        model_out_path = os.path.join(MODEL_ARTIFACTS_DIR, f'model_{h}h.json')
        with open(model_out_path, 'w') as f:
            json.dump(model_export, f, indent=2)
        print(f"    [EXPORT] Saved model artifact: {model_out_path}")
        
    # Export overarching metrics artifact
    metrics_out_path = os.path.join(METRICS_ARTIFACTS_DIR, 'evaluation_metrics.json')
    with open(metrics_out_path, 'w') as f:
        json.dump(all_metrics, f, indent=2)
    print(f"\n[4/5] [EXPORT] Saved complete evaluation metrics: {metrics_out_path}")
    
    # Export May 2024 Storm Replay Dataset for the Web UI
    print("[5/5] Extracting May 2024 G5 storm replay dataset...")
    export_may_storm_replay(raw_df)
    print("Pipeline completed successfully!")

def export_may_storm_replay(df: pd.DataFrame):
    # DOY 130 to 134 of 2024 (May 9 - May 13, 2024)
    storm_sub = df[(df['year'] == 2024) & (df['doy'] >= 130) & (df['doy'] <= 134)].sort_values('timestamp').copy()
    
    replay_records = []
    for _, row in storm_sub.iterrows():
        replay_records.append({
            'time_tag': row['time_tag'],
            'doy': int(row['doy']),
            'hour': int(row['hour']),
            'speed': float(row['flow_speed']) if pd.notna(row['flow_speed']) else None,
            'density': float(row['proton_density']) if pd.notna(row['proton_density']) else None,
            'bz': float(row['bz_gsm']) if pd.notna(row['bz_gsm']) else None,
            'bt': float(row['bt']) if pd.notna(row['bt']) else None,
            'pressure': float(row['pressure']) if pd.notna(row['pressure']) else None,
            'kp': float(row['kp']) if pd.notna(row['kp']) else None,
            'dst': int(row['dst']) if pd.notna(row['dst']) else None
        })
        
    # Save to artifacts & public/data for frontend
    out_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'artifacts', 'replay')
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'may2024_storm.json')
    with open(out_path, 'w') as f:
        json.dump(replay_records, f, indent=2)
    print(f"      Saved {len(replay_records)} replay steps to {out_path}")

if __name__ == '__main__':
    run_pipeline()
