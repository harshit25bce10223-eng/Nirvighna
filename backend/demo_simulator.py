"""
Realistic crowd demo simulator.

Runs the same telemetry pipeline (zone heatmap overlay, footfall forecast,
occupancy counters) with believable synthetic crowd data so the command centre
demo is fully demonstrable without physical edge sensors or a live temple crowd.

All simulator-generated payloads are flagged with source="SIMULATED_FOR_DEMO"
so data provenance stays honest during presentations.
"""

import time
import math
import random
import threading
import logging

logger = logging.getLogger("DemoSimulator")


class _SimTrack:
    """Minimal stand-in for a tracked person (uses same attrs crowd_density reads)."""

    __slots__ = ("track_id", "bbox", "confidence", "center", "history", "last_seen", "lost_frames",
                 "crossed_entry", "crossed_exit")

    def __init__(self, track_id, center, bbox_half=28):
        self.track_id = track_id
        cx, cy = center
        x1, y1 = cx - bbox_half, cy - bbox_half * 1.4
        x2, y2 = cx + bbox_half, cy + bbox_half * 1.4
        self.bbox = (int(x1), int(y1), int(x2), int(y2))
        self.confidence = 0.88 + random.random() * 0.11
        self.center = (float(cx), float(cy))
        self.history = [(float(cx), float(cy))]
        self.last_seen = time.time()
        self.lost_frames = 0
        self.crossed_entry = False
        self.crossed_exit = False


class DemoCrowdSimulator:
    def __init__(self, zones, frame_width=1280, frame_height=720, enabled=True, seed=2026):
        self.zones = zones
        self.frame_width = frame_width
        self.frame_height = frame_height
        self.enabled = enabled
        self._rng = random.Random(seed)
        self._lock = threading.Lock()

        self.total_entries = 1384
        self.total_exits = 712
        self._entry_accum = 0.0
        self._exit_accum = 0.0

        self.tracks = {}
        self._next_track_id = 1

    # ── public ────────────────────────────────────────────────────────
    def set_enabled(self, value):
        with self._lock:
            self.enabled = bool(value)

    def is_enabled(self):
        with self._lock:
            return self.enabled

    def tick(self, now=None):
        """Advance the simulated crowd one step. Call frequently (e.g. every frame)."""
        with self._lock:
            if not self.enabled:
                return
            now = now or time.time()

            base, surge = self._surge_profile(now)
            occupancy = int(base * (0.92 + 0.16 * math.sin(now / 45.0)))
            entry_rate, exit_rate = self._flow_rates(surge)

            self._entry_accum += entry_rate / 10.0
            self._exit_accum += exit_rate / 10.0
            added = int(self._entry_accum)
            removed = int(self._exit_accum)
            self._entry_accum -= added
            self._exit_accum -= removed
            self.total_entries += added
            self.total_exits += removed

            self._rebuild_tracks(occupancy, now)

    def state(self):
        """Snapshot of the current simulated crowd state."""
        with self._lock:
            devotees = self.total_entries - self.total_exits
            minute = 6
            entry_hour = sum(1 for i in range(minute) if self._rng.random() < 0.5) * 12
            exit_hour = sum(1 for i in range(minute) if self._rng.random() < 0.35) * 10
            return {
                "source": "SIMULATED_FOR_DEMO",
                "devotees_present": max(0, devotees),
                "verified_count": max(0, devotees),
                "unverified_count": 0,
                "total_entries": self.total_entries,
                "total_exits": self.total_exits,
                "entry_rate": entry_hour,
                "exit_rate": exit_hour,
                "active_tracks": len(self.tracks),
            }

    # ── internal ──────────────────────────────────────────────────────
    def _surge_profile(self, now):
        """Realistic time-of-day crowd profile for temple pilgrimage (aarti peaks)."""
        local = time.localtime(now)
        hour = local.tm_hour + local.tm_min / 60.0

        if 5.5 <= hour <= 8.5:
            base = 900.0      # Morning aarti surge
        elif 8.5 <= hour <= 11:
            base = 520.0
        elif 11 <= hour <= 14:
            base = 340.0      # Afternoon dip
        elif 14 <= hour <= 17:
            base = 470.0
        elif 17 <= hour <= 20.5:
            base = 980.0      # Evening aarti surge
        elif 20.5 <= hour <= 22.5:
            base = 600.0
        else:
            base = 240.0      # Night lull

        # Smooth, believable day-to-day variance
        base *= 0.88 + 0.24 * abs(math.sin((now + 3600) / 5400.0))
        return base, (base > 800.0)

    def _flow_rates(self, surge):
        peak = 3.2 if surge else 1.2
        return peak + self._rng.random(), peak * 0.55 + self._rng.random() * 0.4

    def _rebuild_tracks(self, occupancy, now):
        """Places synthetic tracks inside zone bounding boxes so the zone heatmap, load
        statuses, and reroute advisories all animate believably during the demo."""
        tracks = {}

        # Direct per-zone load targets (60-95%) so occupancy UI shows realistic pressure
        # that changes over time -> HIGH_DENSITY / MODERATE / reroute all get demoed.
        # One zone cycles into a "clear" dip every ~40s so the AI reroute advisory fires.
        zone_loads = []
        dip_zone = int((now // 40) % len(self.zones))
        for zi, z in enumerate(self.zones):
            wobble = 1.0 + 0.18 * math.sin(now / 50.0 + z["capacity"])
            load = self._rng.uniform(0.60, 0.90) * wobble
            if zi == dip_zone:
                load = self._rng.uniform(0.25, 0.42)  # clear zone -> reroute trigger
            load = min(0.97, max(0.20, load))
            zone_loads.append(load)

        for zi, z in enumerate(self.zones):
            bbox = z["bbox_normalized"]
            x1, y1, x2, y2 = bbox[0], bbox[1], bbox[2], bbox[3]
            n = int(z["capacity"] * zone_loads[zi])
            for _ in range(n):
                nx = self._rng.uniform(x1, x2) + math.sin(now / 8.0 + x1 * 7.0) * 0.008
                ny = self._rng.uniform(y1, y2) + math.cos(now / 9.0 + y1 * 5.0) * 0.006
                cx = int(nx * self.frame_width)
                cy = int(ny * self.frame_height)
                center = (cx, cy)
                tid = self._next_track_id
                self._next_track_id += 1
                tracks[tid] = _SimTrack(tid, center)

        self.tracks = tracks