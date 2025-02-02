from calculations.smoke_layer import SmokeLayerCalculator

def test_smoke_layer_calculations():
    """
    Test smoke layer height and temperature calculations.
    """
    print("\nTesting Smoke Layer Calculator:")
    print("-" * 40)
    
    # Test parameters
    Q = 1000            # Heat release rate (kW)
    room_height = 3.0   # Room height (m)
    floor_area = 50.0   # Floor area (m²)
    target_height = 2.0 # Target smoke layer height (m)
    
    # Test filling time calculation
    time = SmokeLayerCalculator.calculate_filling_time(
        Q, room_height, floor_area, target_height, 'SI'
    )
    
    print(f"\nTest Case 1 - Smoke Layer Filling Time (SI Units):")
    print(f"Heat Release Rate: {Q} kW")
    print(f"Room Height: {room_height} m")
    print(f"Floor Area: {floor_area} m²")
    print(f"Target Height: {target_height} m")
    print(f"Time to reach target height: {time:.1f} seconds")
    
    # Test layer temperature calculation
    layer_temp = SmokeLayerCalculator.calculate_layer_temperature(
        Q, room_height, target_height, 20, 'SI'
    )
    
    print(f"\nTest Case 2 - Smoke Layer Temperature (SI Units):")
    print(f"Heat Release Rate: {Q} kW")
    print(f"Room Height: {room_height} m")
    print(f"Layer Height: {target_height} m")
    print(f"Smoke Layer Temperature: {layer_temp:.1f}°C")

if __name__ == "__main__":
    test_smoke_layer_calculations()