# backend/app/calculations/t_squared.py

import math

class TSquaredCalculator:
    """
    Calculates fire growth based on the t-squared model.
    All calculations are performed in SI units.
    """

    GROWTH_COEFFICIENTS = {
        'slow': 0.00293,
        'medium': 0.01172,
        'fast': 0.0469,
        'ultrafast': 0.1876,
    }

    @staticmethod
    def calculate_hrr(alpha: float, time: float) -> float:
        """
        Calculates heat release rate (Q) from alpha and time.
        Formula: Q = α * t²
        """
        if alpha < 0 or time < 0:
            raise ValueError("Alpha and time must be non-negative.")
        return alpha * (time**2)

    @staticmethod
    def calculate_time(alpha: float, hrr: float) -> float:
        """
        Calculates time (t) to reach a given heat release rate.
        Formula: t = sqrt(Q / α)
        """
        if alpha <= 0 or hrr < 0:
            raise ValueError("Alpha must be positive and HRR must be non-negative.")
        return math.sqrt(hrr / alpha)