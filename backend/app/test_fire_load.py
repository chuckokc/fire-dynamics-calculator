from calculations.fire_load import FireLoadCalculator

def test_fire_load_calculations():
    """
    Test fire load and density calculations.
    """
    print("\nTesting Fire Load Calculator:")
    print("-" * 40)
    
    # Test total fire load calculation
    # Example: Room with wooden furniture and paper products
    masses_si = [100, 50]  # kg (wood and paper)
    heats_of_combustion_si = [17.5, 16.8]  # MJ/kg
    
    total_load = FireLoadCalculator.calculate_total_fire_load(
        masses_si, heats_of_combustion_si, 'SI'
    )
    
    print(f"\nTest Case 1 - Total Fire Load (SI Units):")
    print(f"Material masses: {masses_si[0]}kg wood, {masses_si[1]}kg paper")
    print(f"Total fire load: {total_load:.1f} MJ")
    
    # Test fire load density calculation
    floor_area = 50  # m²
    density = FireLoadCalculator.calculate_fire_load_density(
        total_load, floor_area, 'SI'
    )
    
    print(f"\nTest Case 2 - Fire Load Density (SI Units):")
    print(f"Floor area: {floor_area} m²")
    print(f"Fire load density: {density:.1f} MJ/m²")

if __name__ == "__main__":
    test_fire_load_calculations()