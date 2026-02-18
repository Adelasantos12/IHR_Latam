import sys
import os

# Add the parent directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.seed_data import COUNTRIES, OBLIGATIONS

print(f"Number of countries: {len(COUNTRIES)}")
print(f"Number of obligations: {len(OBLIGATIONS)}")

assert len(COUNTRIES) == 20
assert len(OBLIGATIONS) == 19
print("Seed data validation successful.")
