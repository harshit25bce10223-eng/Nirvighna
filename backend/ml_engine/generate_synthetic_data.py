"""
STEP 1: Synthetic Dataset Generator for Nirvighna ML Crowd Prediction System
Generates daily time-slot footfall data for Somnath, Dwarka, Ambaji, and Pavagadh (2024-01-01 to 2025-12-31).
"""

import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def get_festival_metadata(temple, date_obj):
    """
    Computes real-world festival multipliers and distance in days to nearest festival.
    """
    date_str = date_obj.strftime('%Y-%m-%d')
    year = date_obj.year
    month = date_obj.month
    day_of_week = date_obj.weekday()

    # Major festival dates map per temple
    FESTIVAL_DATES = {
        'Somnath': [
            # Maha Shivratri
            datetime(2024, 3, 8).date(),
            datetime(2025, 2, 26).date(),
            datetime(2026, 2, 15).date(),
        ],
        'Dwarka': [
            # Janmashtami
            datetime(2024, 8, 26).date(),
            datetime(2025, 8, 16).date(),
            datetime(2026, 9, 4).date(),
        ],
        'Ambaji': [
            # Bhadarvi Poonam & Navratri
            datetime(2024, 9, 17).date(),
            datetime(2025, 9, 7).date(),
            datetime(2026, 9, 26).date(),
        ],
        'Pavagadh': [
            # Chaitra & Ashvin Navratri Peak Days
            datetime(2024, 4, 17).date(), # Ram Navami / Navratri peak
            datetime(2024, 10, 11).date(), # Dussehra / Navratri peak
            datetime(2025, 4, 6).date(),
            datetime(2025, 10, 1).date(),
        ]
    }

    current_date = date_obj.date()
    temple_festivals = FESTIVAL_DATES.get(temple, [])

    # Calculate days to nearest festival
    days_diffs = [(f_date - current_date).days for f_date in temple_festivals]
    if days_diffs:
        # Find nearest festival by absolute distance
        nearest_days = min(days_diffs, key=lambda x: abs(x))
    else:
        nearest_days = 999

    # Determine festival multiplier based on exact festival dates and seasonal events
    multiplier = 1.0

    if temple == 'Somnath':
        if current_date in temple_festivals:
            multiplier = 3.5  # Maha Shivratri
        elif month in [7, 8] and day_of_week == 0:
            multiplier = 2.5  # Shravan Monday
        elif abs(nearest_days) <= 2:
            multiplier = 1.8  # Shivratri eve/post

    elif temple == 'Dwarka':
        if current_date in temple_festivals:
            multiplier = 4.0  # Janmashtami
        elif day_of_week == 6 and month in [8, 9]:
            multiplier = 2.0  # Sawan/Bhadra Sunday Ekadashi
        elif abs(nearest_days) <= 2:
            multiplier = 2.2  # Janmashtami festival window

    elif temple == 'Ambaji':
        if current_date in temple_festivals:
            multiplier = 4.5  # Bhadarvi Poonam Mahotsav
        elif month == 10 and 3 <= date_obj.day <= 12:
            multiplier = 3.0  # Navratri
        elif abs(nearest_days) <= 3:
            multiplier = 2.5  # Bhadarvi Poonam walking week

    elif temple == 'Pavagadh':
        if current_date in temple_festivals:
            multiplier = 3.8  # Navratri Garbhagriha peak
        elif (month == 4 and 9 <= date_obj.day <= 17) or (month == 10 and 3 <= date_obj.day <= 12):
            multiplier = 3.2  # Navratri Mahaparv week
        elif abs(nearest_days) <= 2:
            multiplier = 2.0

    return multiplier, int(nearest_days)


def generate_dataset(start_date_str='2024-01-01', end_date_str='2025-12-31', output_path='temple_footfall_synthetic.csv'):
    print(f"Generating synthetic footfall dataset from {start_date_str} to {end_date_str}...")

    np.random.seed(42)

    temple_bases = {
        'Somnath': 800,
        'Dwarka': 1000,
        'Ambaji': 700,
        'Pavagadh': 1200
    }

    slot_factors = {
        'Morning 6-9': 0.8,
        'Afternoon 10-1': 1.2,
        'Evening 4-7': 1.5,
        'Night 8-11': 0.6
    }

    start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
    end_date = datetime.strptime(end_date_str, '%Y-%m-%d')

    rows = []
    current_date = start_date

    while current_date <= end_date:
        date_str = current_date.strftime('%Y-%m-%d')
        day_of_week = current_date.weekday()
        is_weekend = day_of_week in [5, 6]
        month = current_date.month
        is_monsoon = month in [7, 8, 9]

        weekend_factor = 1.4 if is_weekend else 1.0
        monsoon_factor = 0.7 if is_monsoon else 1.0

        for temple, base_cap in temple_bases.items():
            festival_mult, days_to_fest = get_festival_metadata(temple, current_date)

            for time_slot, slot_factor in slot_factors.items():
                # Compute base footfall formula as per STEP 1 specification
                expected_footfall = base_cap * slot_factor * weekend_factor * monsoon_factor * festival_mult

                # Add 5% Gaussian noise
                noise = np.random.normal(0, 0.05 * expected_footfall)
                actual_footfall = int(round(expected_footfall + noise))

                # Ensure footfall never below 50
                actual_footfall = max(50, actual_footfall)

                rows.append({
                    'temple': temple,
                    'date': date_str,
                    'day_of_week': day_of_week,
                    'is_weekend': is_weekend,
                    'month': month,
                    'is_monsoon': is_monsoon,
                    'time_slot': time_slot,
                    'festival_multiplier': round(festival_mult, 2),
                    'days_to_nearest_festival': days_to_fest,
                    'footfall': actual_footfall
                })

        current_date += timedelta(days=1)

    df = pd.DataFrame(rows)
    df.to_csv(output_path, index=False)
    print(f"[OK] Generated {len(df)} rows of synthetic telemetry saved to '{output_path}'.")
    return df

if __name__ == '__main__':
    # Save in current directory or script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_csv = os.path.join(script_dir, 'temple_footfall_synthetic.csv')
    generate_dataset(output_path=output_csv)
