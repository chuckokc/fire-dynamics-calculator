import os
import sys
print("Starting test...")

# Add the parent directory to Python's path so it can find our modules
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from utils.unit_converter import UnitConverter

def test_basic_conversions():
    """
    Tests basic temperature and length conversions to verify our converter works correctly.
    Each test prints its result so we can verify the calculations make sense.
    """
    print("\nTesting Temperature Conversions:")
    print("-" * 30)
    
    # Test freezing point of water
    celsius = 0
    fahrenheit = UnitConverter.temperature_converter(celsius, 'C', 'F')
    kelvin = UnitConverter.temperature_converter(celsius, 'C', 'K')
    print(f"0°C should be:")
    print(f"  32°F: Got {fahrenheit}°F")
    print(f"  273.15K: Got {kelvin}K")
    
    print("\nTesting Length Conversions:")
    print("-" * 30)
    
    # Test a typical room height
    meters = 3
    feet = UnitConverter.length_converter(meters, 'm', 'ft')
    print(f"3 meters should be:")
    print(f"  9.84 feet: Got {feet:.2f} feet")

if __name__ == "__main__":
    print("Running Unit Converter Tests...\n")
    test_basic_conversions()