from calculations.area_volume import AreaVolumeCalculator

def test_area_volume_calculations():
    """
    Test area and volume calculations for different compartment shapes.
    """
    print("\nTesting Area and Volume Calculator:")
    print("-" * 40)
    
    # Test rectangular compartment
    length = 20  # feet
    width = 15   # feet
    height = 8   # feet
    
    rect_results = AreaVolumeCalculator.rectangular_compartment(length, width, height, 'imperial')
    
    print(f"\nRectangular Compartment ({length}' x {width}' x {height}')")
    print(f"Total Surface Area: {rect_results['total_surface_area']:.1f} ft²")
    print(f"Floor Area: {rect_results['floor_area']:.1f} ft²")
    print(f"Wall Area: {rect_results['wall_area']:.1f} ft²")
    print(f"Volume: {rect_results['volume']:.1f} ft³")
    
    # Test cylindrical compartment
    diameter = 12  # feet
    height = 10    # feet
    
    cyl_results = AreaVolumeCalculator.cylindrical_compartment(diameter, height, 'imperial')
    
    print(f"\nCylindrical Compartment ({diameter}' diameter x {height}' height)")
    print(f"Total Surface Area: {cyl_results['total_surface_area']:.1f} ft²")
    print(f"Floor Area: {cyl_results['floor_area']:.1f} ft²")
    print(f"Wall Area: {cyl_results['wall_area']:.1f} ft²")
    print(f"Volume: {cyl_results['volume']:.1f} ft³")

if __name__ == "__main__":
    test_area_volume_calculations()