"""
Footfall forecasting engine.
"""

import time
import datetime
import numpy as np
import logging

logger = logging.getLogger("FootfallForecast")


class FootfallForecaster:
    def __init__(self):
        # Honest accuracy tracking: populated only from real ground-truth feedback.
        self.sample_pairs = []  # list of (predicted_footfall, actual_footfall)
        self._last_forecast = []  # most recently served forecast rows

    def _compute_mape(self):
        """MAPE (%) from recorded (predicted, actual) pairs. None until real data exists."""
        if not self.sample_pairs:
            return None
        errors = []
        for pred, actual in self.sample_pairs:
            if not actual or actual <= 0:
                continue
            errors.append(abs(pred - actual) / actual)
        if not errors:
            return None
        return round(float(np.mean(errors)) * 100.0, 1)

    def record_actual_footfall(self, actual_footfall, slot_timestamp=None):
        """Stores a real ground-truth sample paired with the closest served forecast slot."""
        if not actual_footfall or actual_footfall <= 0:
            return None
        target_ts = None
        if slot_timestamp:
            try:
                target_ts = datetime.datetime.strptime(slot_timestamp, "%Y-%m-%d %H:00:00")
                target_ts = target_ts.replace(minute=0, second=0, microsecond=0)
            except (ValueError, TypeError):
                target_ts = None

        closest = None
        best_gap = None
        for row in self._last_forecast:
            row_ts = row.get("ts")
            if row_ts is None:
                continue
            gap = abs((row_ts - target_ts).total_seconds()) if target_ts else 0
            if best_gap is None or gap < best_gap:
                best_gap = gap
                closest = row

        if closest is None:
            closest = self._last_forecast[-1] if self._last_forecast else None
        if closest is None:
            return None

        self.sample_pairs.append((closest["predicted_footfall"], actual_footfall))
        logger.info(
            "Ground truth recorded: predicted=%s actual=%s samples=%d",
            closest["predicted_footfall"], actual_footfall, len(self.sample_pairs)
        )
        return len(self.sample_pairs)

    def predict_next_3_hours(self, current_occupancy=840):
        """Generates footfall predictions. Accuracy metrics are honest (null until real feedback exists)."""
        now = datetime.datetime.now()
        forecasts = []

        # Baseline multipliers
        base_rate = max(300, current_occupancy)

        for hour_offset in range(1, 4):
            future_time = now + datetime.timedelta(hours=hour_offset)
            time_label = future_time.strftime("%I:00 %p")
            
            hour_of_day = future_time.hour
            # Morning and evening surges
            if 6 <= hour_of_day <= 9 or 18 <= hour_of_day <= 20:
                surge_multiplier = 1.35 + np.sin(hour_offset) * 0.1
            elif 12 <= hour_of_day <= 15:
                surge_multiplier = 0.85
            else:
                surge_multiplier = 1.10

            predicted_count = int(base_rate * surge_multiplier + (hour_offset * 40))

            forecasts.append({
                "time_label": time_label,
                "timestamp": future_time.strftime("%Y-%m-%d %H:00:00"),
                "predicted_footfall": predicted_count,
                "surge_level": "PEAK AARTI SURGE" if surge_multiplier > 1.25 else "REGULAR FLOW"
            })

        self._last_forecast = [
            {
                "predicted_footfall": f["predicted_footfall"],
                "time_label": f["time_label"],
                "ts": datetime.datetime.strptime(f["timestamp"], "%Y-%m-%d %H:00:00"),
            }
            for f in forecasts
        ]

        mape = self._compute_mape()
        return {
            "forecast_accuracy_pct": (round(100.0 - mape, 1) if mape is not None else None),
            "mape_error_pct": mape,
            "ground_truth_samples": len(self.sample_pairs),
            "validation_status": (
                "VALIDATED ON REAL FEEDBACK" if mape is not None
                else "COLLECTING GROUND TRUTH (RETRAIN PENDING)"
            ),
            "predictions": forecasts
        }
