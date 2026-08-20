import urllib.request, json
res = urllib.request.urlopen('http://127.0.0.1:8001/health', timeout=3)
data = json.loads(res.read())
print('Health:', data)

res2 = urllib.request.urlopen('http://127.0.0.1:8001/telemetry', timeout=3)
data2 = json.loads(res2.read())
t = data2
print('=== LIVE DRISHTI TELEMETRY ===')
print('Devotees Present :', t.get('devotees_present', '?'))
print('Real Face Count  :', t.get('real_face_count', '?'))
print('Heads Packed     :', t.get('heads_packed', '?'))
print('Crowd Density    :', t.get('crowd_density', '?'), 'p/m2')
print('Occupancy Rate   :', t.get('occupancy_rate', '?'), '%')
print('Audio Status     :', t.get('audio_status', '?'))
print('Advisory         :', t.get('advisory', '?'))
zones = t.get('zones', {})
for zone, info in zones.items():
    print('Zone', zone, ': load=', info.get('load'), '% headcount=', info.get('headcount'))
