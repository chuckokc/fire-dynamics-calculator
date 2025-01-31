from calculations.material_properties import MaterialProperties

def test_material_properties():
    """
    Test material properties database and conversion functions using Quintiere (2016) values.
    """
    print("\nTesting Material Properties Database:")
    print("-" * 40)
    
    # Test heat of combustion retrieval
    material = "gasoline"
    hoc_si = MaterialProperties.get_heat_of_combustion(material, 'SI')
    hoc_imperial = MaterialProperties.get_heat_of_combustion(material, 'imperial')
    
    print(f"\nTest Case 1 - Heat of Combustion for {material}:")
    print(f"SI Units: {hoc_si} MJ/kg")
    print(f"Imperial Units: {hoc_imperial:.1f} BTU/lb")
    
    # Test mass burning flux retrieval
    material = "liquefied_propane"
    flux_si = MaterialProperties.get_mass_burning_flux(material, 'SI')
    flux_imperial = MaterialProperties.get_mass_burning_flux(material, 'imperial')
    
    print(f"\nTest Case 2 - Mass Burning Flux for {material}:")
    print(f"SI Units: {flux_si} g/m²-s")
    print(f"Imperial Units: {flux_imperial:.4f} lb/ft²-s")
    
    # Test thermal properties retrieval
    material = "gypsum_board"
    properties = MaterialProperties.get_thermal_properties(material)
    
    print(f"\nTest Case 3 - Thermal Properties for {material}:")
    print(f"Conductivity: {properties['conductivity']} kW/m/K")
    print(f"Density: {properties['density']} kg/m³")
    print(f"Specific Heat: {properties['specific_heat']} kJ/kg/K")
    
    # Test error handling for non-existent material
    print("\nTest Case 4 - Error Handling:")
    try:
        MaterialProperties.get_heat_of_combustion("not_a_real_material")
        print("Failed: Should have raised an error for non-existent material")
    except ValueError as e:
        print(f"Successfully caught error: {e}")

if __name__ == "__main__":
    test_material_properties()