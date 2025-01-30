from calculations.flashover import FlashoverCalculator

def test_flashover_calculations():
    """
    Test flashover calculations using the example from NUREG-1805:
    Room 8' x 10' x 7' with a door 3' x 6'
    """
    print("\nTesting Flashover Calculator:")
    print("-" * 40)
    
    # Room dimensions from example
    length = 10  # feet
    width = 8    # feet
    height = 7   # feet
    
    # Door dimensions
    door_width = 3   # feet
    door_height = 6  # feet
    
    # Calculate areas
    At = 2 * (length * width + length * height + width * height)  # Total surface area
    A0 = door_width * door_height  # Opening area
    H0 = door_height  # Opening height
    hk = 0.0016  # Effective heat transfer coefficient for gypsum board
    
    # Test all three methods
    mqh = FlashoverCalculator.mccaffrey_correlation(At, A0, H0, hk, 'imperial')
    babrauskas = FlashoverCalculator.babrauskas_correlation(A0, H0, 'imperial')
    thomas = FlashoverCalculator.thomas_correlation(At, A0, H0, 'imperial')
    
    print(f"\nRoom dimensions: {width}' x {length}' x {height}'")
    print(f"Door dimensions: {door_width}' x {door_height}'")
    print("\nRequired Heat Release Rate for Flashover:")
    print(f"MQH Method: {mqh:.0f} kW")
    print(f"Babrauskas Method: {babrauskas:.0f} kW")
    print(f"Thomas Method: {thomas:.0f} kW")

if __name__ == "__main__":
    test_flashover_calculations()