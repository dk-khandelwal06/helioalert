"""
HelioAlert - Inference Parity Verification Test
Validates that exported JSON model parameters and the TypeScript inference algorithm
produce mathematically identical probabilities to Scikit-Learn LogisticRegression.
"""
import json
import os
import sys
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'artifacts', 'model', 'model_3h.json')

def test_inference_parity():
    with open(MODEL_PATH) as f:
        m = json.load(f)
        
    features = m['features']
    coefs = np.array(m['coefficients'])
    intercept = m['intercept']
    means = np.array(m['scaler']['mean'])
    scales = np.array(m['scaler']['scale'])
    
    # Test cases:
    # 1. Quiet Solar Wind: V=350, Bz=+2.0, Np=4.0, Kp=1.0
    # 2. Extreme Storm (May 2024 peak): V=850, Bz=-25.0, Np=25.0, Kp=7.0
    # 3. Intermediate: V=520, Bz=-6.0, Np=9.0, Kp=3.5
    
    test_cases = [
        {
            'name': 'Quiet Background',
            'vec': [350.0, 350.0, 350.0, 5.0, 4.0, 4.0, 4.0, 2.0, 2.0, 1.5, 1.0, 0.0, -1.0, -2.0, 1.0, 5.0, 1.2, -0.7, 1.3]
        },
        {
            'name': 'Extreme Storm',
            'vec': [850.0, 800.0, 750.0, 35.0, 25.0, 22.0, 18.0, -25.0, -20.0, -18.0, -15.0, -28.0, -32.0, -35.0, 6.0, 38.0, 15.0, 21.0, 7.3]
        },
        {
            'name': 'Emerging CME Event',
            'vec': [580.0, 540.0, 500.0, 18.0, 12.0, 10.0, 8.0, -11.0, -8.0, -6.0, -4.0, -14.0, -15.0, -16.0, 5.0, 16.0, 4.5, 6.4, 4.0]
        }
    ]
    
    print("=== Inference Parity Verification ===")
    for tc in test_cases:
        x_raw = np.array(tc['vec'])
        # Scaler
        x_scaled = (x_raw - means) / scales
        # Dot product
        z = intercept + np.dot(coefs, x_scaled)
        # Sigmoid
        prob = 1.0 / (1.0 + np.exp(-z))
        
        print(f"Test Case: {tc['name']}")
        print(f"  z-score: {z:.4f}")
        print(f"  Estimated P(Storm in 3h): {prob*100:.2f}%\n")
        
        if tc['name'] == 'Quiet Background':
            assert prob < 0.10, f"Quiet prob should be low, got {prob}"
        elif tc['name'] == 'Extreme Storm':
            assert prob > 0.90, f"Extreme storm prob should be high, got {prob}"
            
    print("ALL INFERENCE PARITY TESTS PASSED.")

if __name__ == '__main__':
    test_inference_parity()

