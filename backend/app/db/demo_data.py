"""Illustrative Port Harcourt demo points, not surveyed or live GPS positions.

Phone numbers are synthetic demo identifiers and are not for contacting people.
"""
ZONE = "Port Harcourt"
# Stable locations shared by customers, riders, and the demo administrator.
LOCATIONS = (
    ("Old GRA, Port Harcourt", 4.7850, 7.0100),
    ("D-Line, Port Harcourt", 4.8050, 7.0050),
    ("Trans Amadi, Port Harcourt", 4.8100, 7.0400),
    ("Diobu, Port Harcourt", 4.7950, 6.9900),
    ("Rumuola, Port Harcourt", 4.8350, 7.0000),
    ("Woji, Port Harcourt", 4.8250, 7.0600),
    ("Elelenwo, Port Harcourt", 4.8500, 7.0800),
    ("Borokiri, Port Harcourt", 4.7550, 7.0350),
    ("New GRA, Port Harcourt", 4.8200, 6.9900),
    ("Rumuokoro, Port Harcourt", 4.8750, 7.0000),
)


def demo_accounts():
    accounts = [("admin@example.com", "Demo Admin", "admin", 0)]
    accounts += [(f"customer{i:02d}@example.com", f"Demo Customer {i:02d}", "customer", i - 1) for i in range(1, 9)]
    accounts += [(f"rider{i:02d}@example.com", f"Demo Rider {i:02d}", "rider", (i - 1) % len(LOCATIONS)) for i in range(1, 22)]
    for index, (email, name, role, location_index) in enumerate(accounts, start=1):
        address, latitude, longitude = LOCATIONS[location_index]
        # Distinct synthetic points for riders within each named neighborhood.
        if role == "rider":
            latitude += (index - 10) // len(LOCATIONS) * 0.0003
            longitude += (index - 10) // len(LOCATIONS) * 0.0002
        yield dict(email=email, full_name=name, role=role,
                   phone=f"+234000000{index:04d}", zone=ZONE, address=address,
                   latitude=round(latitude, 6), longitude=round(longitude, 6))
