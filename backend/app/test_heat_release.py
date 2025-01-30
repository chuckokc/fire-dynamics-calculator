from calculations.heat_release import HeatReleaseCalculator

def test_heat_release_calculations():
    """
    Test heat release rate calculations with known values.
    """
    print("\nTesting Heat Release Calculator:")
    print("-" * 40)
    
    # Test Case 1: Calculate mass loss rate from known heat release
    Q = 1000  # 1MW fire
    H_c = 20000  # 20 MJ/kg (typical for many hydrocarbons)
    
    # Test with SI units
    mass_rate_si = HeatReleaseCalculator.calculate_mass_loss_rate(Q, H_c, 'SI')
    print(f"\nTest Case 1 (SI Units):")
    print(f"Heat Release Rate: {Q} kW")
    print(f"Heat of Combustion: {H_c} kJ/kg")
    print(f"Calculated Mass Loss Rate: {mass_rate_si:.3f} kg/s")
    
    # Test Case 2: Calculate heat release rate from mass loss
    mass_rate = 0.05  # kg/s
    
    # Test with SI units
    Q_si = HeatReleaseCalculator.calculate_heat_release_rate(mass_rate, H_c, 'SI')
    print(f"\nTest Case 2 (SI Units):")
    print(f"Mass Loss Rate: {mass_rate} kg/s")
    print(f"Heat of Combustion: {H_c} kJ/kg")
    print(f"Calculated Heat Release Rate: {Q_si:.1f} kW")

if __name__ == "__main__":
    test_heat_release_calculations()