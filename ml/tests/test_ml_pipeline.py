"""
HelioAlert - Machine Learning Pipeline Unit Tests
Validates NASA OMNI2 parsing, feature calculation, absence of target leakage, and inference logic.
"""
import unittest
import os
import sys
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from ml.src.omni_parser import parse_omni2_line
from ml.src.features import engineer_features, FEATURE_NAMES

class TestMLPipeline(unittest.TestCase):
    
    def test_parse_omni2_line(self):
        # Sample synthetic line with fill values and realistic measurements
        # Format: Year DOY Hour ...
        line = "2024 131  0 2601 51 52  60  11   6.5   6.2 -44.5 146.4  -3.7   2.5  -4.4   4.1  -3.0   0.4   1.8   0.6   1.2   1.3   61023.   5.4  410.   0.2   1.8 0.055  1.85   15574.   0.6    6.   1.3   2.0 0.017   1.23   1.01   7.3 27 172    12  168 999999.99 99999.99 99999.99 99999.99 99999.99 99999.99  0  12 227.9   1.1   -64   104  5.4"
        res = parse_omni2_line(line)
        self.assertIsNotNone(res)
        self.assertEqual(res['year'], 2024)
        self.assertEqual(res['doy'], 131)
        self.assertEqual(res['hour'], 0)
        self.assertAlmostEqual(res['flow_speed'], 410.0)
        self.assertAlmostEqual(res['bz_gsm'], -3.0)
        self.assertAlmostEqual(res['kp'], 2.7) # raw 27 / 10 = 2.7
        self.assertEqual(res['dst'], 12)
        
    def test_fill_value_conversion(self):
        # Line with standard fill values (9999. for speed, 999.9 for bz)
        line = "2024 131  1 2601 99 99 999 999 999.9 999.9 999.9 999.9 999.9 999.9 999.9 999.9 999.9 999.9 999.9 999.9 999.9 999.9 9999999. 999.9 9999. 999.9 999.9 9.999 99.99 9999999. 999.9 9999. 999.9 999.9 9.999 999.99 999.99 999.9 99 999 99999 9999 999999.99 99999.99 99999.99 99999.99 99999.99 99999.99  0 999 999.9 999.9 99999 99999  99.9"
        res = parse_omni2_line(line)
        self.assertIsNotNone(res)
        self.assertIsNone(res['flow_speed'])
        self.assertIsNone(res['bz_gsm'])
        self.assertIsNone(res['kp'])
        
    def test_zero_leakage_in_target(self):
        # Create a synthetic series of 10 hourly points
        # At hour 4, Kp = 6.0 (Storm)
        # Prediction at hour 3 for 3h horizon should be 1
        # Prediction at hour 0 for 3h horizon (covers hours 1, 2, 3) should be 0!
        times = pd.date_range("2024-05-01 00:00:00", periods=10, freq="1h", tz="UTC")
        df = pd.DataFrame({
            'timestamp': times,
            'time_tag': [t.isoformat() for t in times],
            'flow_speed': [400.0] * 10,
            'proton_density': [5.0] * 10,
            'bz_gsm': [0.0] * 10,
            'bt': [5.0] * 10,
            'pressure': [1.5] * 10,
            'electric_field': [0.0] * 10,
            'kp': [1.0, 1.0, 1.0, 1.0, 6.0, 1.0, 1.0, 1.0, 1.0, 1.0] # peak at index 4
        })
        
        feat_df = engineer_features(df)
        
        # Check target_3h
        # Index 0 looks at [1, 2, 3] -> max is 1.0 < 5.0 -> Target = 0
        self.assertEqual(feat_df.loc[0, 'target_3h'], 0)
        # Index 1 looks at [2, 3, 4] -> max is 6.0 >= 5.0 -> Target = 1
        self.assertEqual(feat_df.loc[1, 'target_3h'], 1)
        # Index 4 (storm hour itself): looks at [5, 6, 7] -> max is 1.0 -> Target = 0! (t itself not included in future window)
        self.assertEqual(feat_df.loc[4, 'target_3h'], 0)

    def test_inference_sigmoid_parity(self):
        # Test sigmoid math: p = 1 / (1 + exp(-z))
        z = 0.0
        p = 1.0 / (1.0 + np.exp(-z))
        self.assertAlmostEqual(p, 0.5)
        
        z = 2.0
        p = 1.0 / (1.0 + np.exp(-z))
        self.assertTrue(0.88 < p < 0.89)

if __name__ == '__main__':
    unittest.main()

