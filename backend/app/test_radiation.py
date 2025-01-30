from calculations.radiation import PointSourceRadiationCalculator

def test_radiation_calculations():
    """
    Test point source radiation calculations with known values.
    """
    print("\nTesting Point Source Radiation Calculator:")
    print("-" * 40)
    
    # Test Case: 1MW fire with 30% radiative fraction
    Q = 1000  # 1MW fire
    R = 0.3   # 30% radiative fraction
    X = 5     # 5m distance
    
    # Test with SI units
    flux_si = PointSourceRadiationCalculator.calculate_heat_flux(Q, R, X, 'SI')
    print(f"\nTest Case (SI Units):")
    print(f"Heat Release Rate: {Q} kW")
    print(f"Radiative Fraction: {R}")
    print(f"Distance: {X} m")
    print(f"Calculated Heat Flux: {flux_si:.2f} kW/m²")
    
    # Test with Imperial units
    X_ft = X * 3.28084  # 5m in feet
    flux_imperial = PointSourceRadiationCalculator.calculate_heat_flux(Q, R, X_ft, 'imperial')
    print(f"\nTest Case (Imperial Units):")
    print(f"Heat Release Rate: {Q} kW")
    print(f"Radiative Fraction: {R}")
    print(f"Distance: {X_ft:.2f} ft")
    print(f"Calculated Heat Flux: {flux_imperial:.4f} BTU/ft²/s")

if __name__ == "__main__":
    test_radiation_calculations()