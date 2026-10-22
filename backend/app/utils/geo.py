from math import asin, cos, radians, sin, sqrt

def distance_km(lat1, lon1, lat2, lon2):
    a, b = radians(lat1), radians(lat2)
    delta_lat, delta_lon = radians(lat2 - lat1), radians(lon2 - lon1)
    h = sin(delta_lat / 2) ** 2 + cos(a) * cos(b) * sin(delta_lon / 2) ** 2
    return 6371.0088 * 2 * asin(min(1, sqrt(h)))
