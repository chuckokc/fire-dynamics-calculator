from calculations.flashover import FlashoverCalculator

def test_flashover_calculations():
    """
    Test flashover calculations using NUREG-1805 example:
    Room 8' x 10' with a ceiling height of 7' and a door 3' x 6'
    """
    print("\nTesting Flashover Calculator:")
    print("-" * 40)
    
    # Room dimensions from NUREG-1805 example
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
    
    # Test all three methods
    mqh = FlashoverCalculator.mccaffrey_correlation(At, A0, H0, 'gypsum_board', 'imperial')
    babrauskas = FlashoverCalculator.babrauskas_correlation(A0, H0, 'imperial')
    thomas = FlashoverCalculator.thomas_correlation(At, A0, H0, 'imperial')
    
    print(f"\nRoom dimensions: {width}' x {length}' x {height}'")
    print(f"Door dimensions: {door_width}' x {door_height}'")
    print("\nRequired Heat Release Rate for Flashover:")
    print(f"MQH Method: {mqh:.0f} kW")
    print(f"Babrauskas Method: {babrauskas:.0f} kW")
    print(f"Thomas Method: {thomas:.0f} kW")
    
    # Test validation
    print("\nTesting input validation:")
    try:
        FlashoverCalculator.validate_compartment_inputs(100, 150, 10)
        print("Failed: Should have caught invalid vent area")
    except ValueError as e:
        print(f"Successfully caught error: {e}")

if __name__ == "__main__":
    test_flashover_calculations()