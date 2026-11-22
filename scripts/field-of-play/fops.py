"""Field-of-play drawings per sport, redrawn from Planos.pptx in the portal's palette.

Coordinates are fractions of the slide's field image ("picture"): u across, v down.
Radii are fractions of the picture width. gen.py turns this into fopLayouts.ts.
"""

# Palette (portal tokens, muted sport colours)
ZONE, ZONE_LINE, DESK, DARK, TEXT = "#eceff3", "#b8c1cc", "#dde3ea", "#2b3a4e", "#5b6676"
FIELD, GRASS, GRASS2 = "#dde9e2", "#cfe3d5", "#b9d6c2"
WATER, WATER2, SAND = "#d4e9f2", "#b7d9e8", "#f3e7c6"
ORANGE, BLUE_C, MAT_B, MAT_R, RING, TRACK = "#f2c6a3", "#c9d7f2", "#c3d3f3", "#f1c0ba", "#f6e0dc", "#e6b8a6"
TEAL, RED, BLUE, AMBER, WHITE, NONE = "#0a6b70", "#d7372a", "#2a5aa8", "#c98a1a", "#ffffff", "none"


def R(u0, v0, u1, v1, fill=ZONE, stroke=ZONE_LINE, sw=2, dash=False, rx=0, rxh=None):
    return {"t": "r", "a": [u0, v0, u1, v1], "f": fill, "s": stroke, "w": sw, "d": dash, "rx": rx, "rxh": rxh}


def L(u0, v0, u1, v1, stroke=DARK, sw=2, dash=False):
    return {"t": "l", "a": [u0, v0, u1, v1], "s": stroke, "w": sw, "d": dash}


def C(u, v, r, fill=NONE, stroke=DARK, sw=2, dash=False):
    return {"t": "c", "a": [u, v, r], "f": fill, "s": stroke, "w": sw, "d": dash}


def A(u, v, r, a0, a1, stroke=WHITE, sw=2, dash=False):
    """Arc centred at (u, v), radius r (fraction of width), from a0 to a1 degrees (0 = right, 90 = down)."""
    return {"t": "a", "a": [u, v, r, a0, a1], "s": stroke, "w": sw, "d": dash}


def P(pts, fill=NONE, stroke=DARK, sw=2):
    return {"t": "p", "a": pts, "f": fill, "s": stroke, "w": sw}


def T(u, v, text, size=13, color=TEXT, weight=600, rot=0):
    return {"t": "t", "a": [u, v], "x": text, "z": size, "c": color, "wt": weight, "rot": rot}


def stand(u0, v0, u1, v1, label=None, size=12):
    out = [R(u0, v0, u1, v1, DESK, ZONE_LINE, 2, rx=6)]
    if label:
        out.append(T((u0 + u1) / 2, (v0 + v1) / 2, label, size))
    return out


def octagon(u0, v0, u1, v1, k=0.29):
    w, h = u1 - u0, v1 - v0
    return [[u0 + w * k, v0], [u1 - w * k, v0], [u1, v0 + h * k], [u1, v1 - h * k], [u1 - w * k, v1], [u0 + w * k, v1], [u0, v1 - h * k], [u0, v0 + h * k]]


def lanes(u0, v0, u1, v1, n, stroke=WHITE, dash=True, horizontal=True):
    out = []
    for i in range(1, n):
        if horizontal:
            v = v0 + (v1 - v0) * i / n
            out.append(L(u0, v, u1, v, stroke, 2, dash))
        else:
            u = u0 + (u1 - u0) * i / n
            out.append(L(u, v0, u, v1, stroke, 2, dash))
    return out


LAYOUTS = {}

# ---------- Athletics (stadium) ----------
LAYOUTS["athletics"] = [
    # stands
    R(0.18, 0.03, 0.83, 0.16, ZONE, ZONE_LINE, 2, rx=18), T(0.505, 0.095, "TRIBUNE", 14),
    R(0.06, 0.16, 0.15, 0.78, ZONE, ZONE_LINE, 2, rx=18), R(0.85, 0.16, 0.94, 0.78, ZONE, ZONE_LINE, 2, rx=18),
    R(0.23, 0.855, 0.44, 0.93, ZONE, ZONE_LINE, 2, rx=10), R(0.56, 0.855, 0.77, 0.93, ZONE, ZONE_LINE, 2, rx=10),
    R(0.45, 0.94, 0.55, 0.985, DESK, ZONE_LINE, 2), T(0.5, 0.963, "MIXED ZONE", 10),
    # track and infield
    R(0.12, 0.145, 0.88, 0.835, TRACK, "#c98d78", 2, rxh=0.5),
    R(0.165, 0.755, 0.815, 0.835, TRACK, NONE, 0),
    *lanes(0.165, 0.755, 0.815, 0.835, 4, WHITE, False),
    R(0.17, 0.21, 0.83, 0.765, GRASS, "#9cc3a8", 2, rxh=0.5),
    L(0.7, 0.755, 0.7, 0.835, WHITE, 4), T(0.7, 0.865, "FINISH", 11, RED, 700),
    # jumps (runways + pits)
    R(0.36, 0.235, 0.41, 0.265, SAND, AMBER, 2), L(0.41, 0.25, 0.6, 0.25, "#c98d78", 6),
    R(0.42, 0.28, 0.65, 0.296, TRACK, NONE, 0), R(0.64, 0.272, 0.67, 0.304, "#e58e7c", NONE, 0), T(0.5, 0.33, "JUMPS", 11),
    R(0.30, 0.72, 0.345, 0.75, SAND, AMBER, 2), L(0.345, 0.735, 0.71, 0.735, "#c98d78", 6), T(0.52, 0.71, "LONG / TRIPLE JUMP", 10),
    # high jump / pole vault (left), throws
    L(0.17, 0.5, 0.29, 0.5, "#c98d78", 10), R(0.19, 0.42, 0.215, 0.46, MAT_B, BLUE, 2), R(0.19, 0.54, 0.215, 0.58, MAT_B, BLUE, 2),
    R(0.265, 0.40, 0.29, 0.45, MAT_B, BLUE, 2), R(0.265, 0.48, 0.29, 0.52, MAT_B, BLUE, 2), T(0.24, 0.37, "THROWS", 10),
    C(0.22, 0.64, 0.008, DESK, DARK, 2), R(0.70, 0.28, 0.76, 0.33, MAT_B, BLUE, 2), T(0.73, 0.36, "POLE VAULT", 10),
    R(0.25, 0.25, 0.31, 0.30, MAT_B, BLUE, 2), T(0.28, 0.33, "HIGH JUMP", 10),
    L(0.71, 0.5, 0.83, 0.5, "#c98d78", 10),
    L(0.59, 0.64, 0.73, 0.70, DARK, 1), L(0.66, 0.56, 0.73, 0.65, DARK, 2), T(0.62, 0.6, "JAVELIN", 10),
    A(0.70, 0.55, 0.08, 20, 80, DARK, 3), T(0.79, 0.68, "SHOT PUT", 10),
]

# ---------- Fencing ----------
LAYOUTS["fencing"] = [
    *stand(0.43, 0.196, 0.572, 0.284, "REFEREE / VIDEO", 10),
    R(0.219, 0.38, 0.78, 0.61, "#d9dee6", "#8f9aaa", 2, rx=6),
    R(0.235, 0.41, 0.765, 0.585, "#c9d2dd", NONE, 0),
    L(0.235, 0.41, 0.765, 0.41, "#3a9a5a", 3), L(0.235, 0.585, 0.765, 0.585, RED, 3),
    L(0.25, 0.41, 0.25, 0.585, RED, 3), L(0.75, 0.41, 0.75, 0.585, RED, 3),
    L(0.31, 0.41, 0.31, 0.585, AMBER, 2, True), L(0.69, 0.41, 0.69, 0.585, AMBER, 2, True),
    L(0.42, 0.41, 0.42, 0.585, WHITE, 3), L(0.58, 0.41, 0.58, 0.585, WHITE, 3), L(0.5, 0.41, 0.5, 0.585, BLUE, 3),
    T(0.5, 0.65, "PISTE (14 m)", 11),
    R(0.109, 0.43, 0.19, 0.57, ZONE, ZONE_LINE, 2, rx=6), T(0.15, 0.5, "COACH", 10),
    R(0.81, 0.43, 0.89, 0.57, ZONE, ZONE_LINE, 2, rx=6), T(0.85, 0.5, "COACH", 10),
    R(0.109, 0.62, 0.18, 0.68, DESK, ZONE_LINE, 2), R(0.82, 0.62, 0.89, 0.68, DESK, ZONE_LINE, 2),
]

# ---------- 3x3 Basketball (half court) ----------
LAYOUTS["3x3"] = [
    R(0.061, 0.084, 0.937, 0.915, NONE, ZONE_LINE, 2, True),
    R(0.231, 0.153, 0.788, 0.862, ORANGE, "#c9875a", 2),
    R(0.385, 0.153, 0.611, 0.383, "#eaa97c", WHITE, 3),
    L(0.267, 0.153, 0.267, 0.27, WHITE, 3), L(0.75, 0.153, 0.75, 0.27, WHITE, 3),
    A(0.5085, 0.27, 0.2415, 0, 180, WHITE, 3),
    A(0.498, 0.383, 0.113, 0, 180, WHITE, 3, True),
    A(0.534, 0.21, 0.055, 15, 165, WHITE, 2),
    L(0.462, 0.143, 0.536, 0.143, DARK, 5), C(0.534, 0.169, 0.011, NONE, RED, 3),
    T(0.51, 0.62, "3x3 COURT", 13, "#a8613a", 700),
]

# ---------- Rugby Sevens ----------
LAYOUTS["rugby"] = [
    R(0.0, 0.0, 1.0, 1.0, "#e9f3ec", NONE, 0),
    R(0.149, 0.17, 0.851, 0.828, GRASS, DARK, 3),
    R(0.149, 0.17, 0.22, 0.828, GRASS2, NONE, 0), R(0.78, 0.17, 0.851, 0.828, GRASS2, NONE, 0),
    R(0.149, 0.17, 0.851, 0.828, NONE, DARK, 3),
    L(0.22, 0.17, 0.22, 0.828, WHITE, 3), L(0.78, 0.17, 0.78, 0.828, WHITE, 3),
    L(0.374, 0.17, 0.374, 0.828, WHITE, 3), L(0.624, 0.17, 0.624, 0.828, WHITE, 3),
    L(0.43, 0.17, 0.43, 0.828, WHITE, 2, True), L(0.57, 0.17, 0.57, 0.828, WHITE, 2, True), L(0.5, 0.17, 0.5, 0.828, WHITE, 3),
    *[L(0.149, v, 0.851, v, WHITE, 1, True) for v in (0.219, 0.313, 0.687, 0.781)],
    L(0.22, 0.44, 0.22, 0.556, DARK, 5), L(0.78, 0.44, 0.78, 0.556, DARK, 5),
    T(0.185, 0.5, "IN-GOAL", 10, TEXT, 600, -90), T(0.815, 0.5, "IN-GOAL", 10, TEXT, 600, 90),
]

# ---------- Table Tennis ----------
LAYOUTS["table-tennis"] = [
    *stand(0.027, 0.041, 0.971, 0.104, "MEDIA / TRIBUNE", 11), *stand(0.027, 0.874, 0.971, 0.957, "MAIN TRIBUNE", 12),
    R(0.143, 0.167, 0.857, 0.833, "#e3e8ef", DARK, 3), R(0.164, 0.197, 0.836, 0.803, NONE, ZONE_LINE, 2, True),
    R(0.415, 0.385, 0.585, 0.613, "#2f7fb5", WHITE, 3), L(0.415, 0.5, 0.585, 0.5, WHITE, 2), L(0.5, 0.36, 0.5, 0.64, DARK, 3),
    R(0.48, 0.30, 0.52, 0.33, DESK, DARK, 2), R(0.48, 0.657, 0.52, 0.693, DARK, DARK, 2), T(0.5, 0.735, "UMPIRE", 10),
    R(0.185, 0.24, 0.205, 0.27, DESK, ZONE_LINE, 2), R(0.79, 0.24, 0.81, 0.27, DESK, ZONE_LINE, 2),
    R(0.185, 0.755, 0.24, 0.78, DESK, ZONE_LINE, 2), R(0.76, 0.755, 0.815, 0.78, DESK, ZONE_LINE, 2),
]

# ---------- Judo ----------
LAYOUTS["judo"] = [
    R(0.089, 0.032, 0.911, 0.095, ZONE, ZONE_LINE, 2, True), T(0.5, 0.064, "TRIBUNE", 11),
    R(0.255, 0.144, 0.745, 0.853, MAT_B, BLUE, 3, rx=4),
    R(0.36, 0.296, 0.64, 0.703, MAT_R, RED, 3), L(0.48, 0.5, 0.52, 0.5, WHITE, 3), L(0.5, 0.47, 0.5, 0.53, WHITE, 3),
    T(0.5, 0.66, "CONTEST AREA", 11, "#8a2a22", 700), T(0.5, 0.22, "SAFETY AREA (TATAMI)", 10, BLUE, 700),
    R(0.262, 0.153, 0.305, 0.212, MAT_R, RED, 2), R(0.695, 0.787, 0.738, 0.846, MAT_B, BLUE, 2),
    L(0.111, 0.853, 0.889, 0.853, DARK, 2, True),
    R(0.089, 0.891, 0.911, 0.97, ZONE, ZONE_LINE, 2, True), R(0.265, 0.868, 0.35, 0.898, "#f5e39a", AMBER, 2),
    R(0.366, 0.868, 0.634, 0.898, WHITE, DARK, 2), T(0.5, 0.94, "REFEREE / IJF JURY", 10),
]

# ---------- Wrestling ----------
LAYOUTS["wrestling"] = [
    R(0.25, 0.007, 0.75, 0.699, "#e3ecfb", BLUE, 3),
    C(0.5, 0.353, 0.2, "#f2c9b8", "#d96d3a", 3), C(0.5, 0.353, 0.183, "#f0b48f", RED, 3),
    C(0.5, 0.353, 0.15, "#f0b48f", "#d96d3a", 2), C(0.5, 0.353, 0.037, WHITE, RED, 3),
    L(0.475, 0.353, 0.495, 0.353, RED, 4), L(0.505, 0.353, 0.525, 0.353, BLUE, 4),
    R(0.217, 0.666, 0.275, 0.746, MAT_R, RED, 3, rx=6), R(0.725, 0.666, 0.783, 0.746, MAT_B, BLUE, 3, rx=6),
    C(0.199, 0.755, 0.011, RED, RED, 1), C(0.8, 0.755, 0.011, BLUE, BLUE, 1),
    T(0.246, 0.79, "RED CORNER", 10, RED, 700), T(0.754, 0.79, "BLUE CORNER", 10, BLUE, 700),
    *stand(0.33, 0.86, 0.67, 0.93, "JUDGES / MAT CHAIRMAN", 11),
]

# ---------- Archery ----------
LAYOUTS["archery"] = [
    R(0.039, 0.055, 0.959, 0.942, NONE, ZONE_LINE, 2, True),
    R(0.079, 0.111, 0.919, 0.884, "#f4f6f8", "#8f9aaa", 2),
    R(0.089, 0.151, 0.14, 0.844, DESK, ZONE_LINE, 2), T(0.115, 0.5, "ATHLETE AREA", 10, TEXT, 600, -90),
    R(0.159, 0.27, 0.209, 0.425, ZONE, ZONE_LINE, 2, rx=4), R(0.159, 0.576, 0.209, 0.73, ZONE, ZONE_LINE, 2, rx=4),
    L(0.219, 0.111, 0.219, 0.884, ZONE_LINE, 2, True), L(0.28, 0.111, 0.28, 0.884, BLUE, 3), T(0.28, 0.08, "SHOOTING LINE", 10, BLUE, 700),
    L(0.819, 0.111, 0.819, 0.884, RED, 3), T(0.819, 0.08, "TARGET LINE", 10, RED, 700),
    C(0.825, 0.345, 0.022, "#f5d547", "#2f86c9", 6), C(0.825, 0.652, 0.022, "#f5d547", "#2f86c9", 6),
    R(0.884, 0.111, 0.919, 0.884, "#e6ecf7", NONE, 0),
    L(0.28, 0.499, 0.819, 0.499, "#2f86c9", 2), R(0.52, 0.475, 0.6, 0.522, WHITE, "#2f86c9", 2), T(0.56, 0.499, "70 m", 10, "#2f86c9", 700),
    R(0.229, 0.8, 0.33, 0.862, DARK, DARK, 2), T(0.28, 0.83, "JUDGES", 9, WHITE, 700),
    *stand(0.25, 0.912, 0.75, 0.98, "TRIBUNE", 11),
]

# ---------- Coastal rowing / beach sprint ----------
LAYOUTS["coastal-rowing"] = [
    R(0.062, 0.0, 0.5, 0.907, SAND, NONE, 0), R(0.5, 0.0, 0.975, 0.907, WATER, NONE, 0),
    T(0.28, 0.04, "BEACH / SAND SPRINT", 12, "#a06a12", 700), T(0.74, 0.04, "WATER / SLALOM", 12, "#2f6f8f", 700),
    *stand(0.087, 0.077, 0.2, 0.172, "JUDGES TOWER", 9),
    R(0.099, 0.392, 0.298, 0.502, "#f4d98c", AMBER, 2, True), T(0.2, 0.447, "SAND SPRINT TRACK", 10, "#8a5a00", 700),
    L(0.3, 0.262, 0.3, 0.629, RED, 4), T(0.3, 0.66, "FINISH", 10, RED, 700),
    L(0.5, 0.262, 0.5, 0.629, "#2f86c9", 3, True),
    C(0.624, 0.446, 0.012, "#e8762c", "#e8762c", 1), C(0.737, 0.446, 0.012, "#e8762c", "#e8762c", 1), C(0.849, 0.446, 0.017, RED, RED, 1),
    T(0.624, 0.5, "BUOY 1", 9), T(0.737, 0.5, "BUOY 2", 9), T(0.849, 0.51, "APEX BUOY", 9, RED, 700),
]

# ---------- Volleyball ----------
LAYOUTS["volleyball"] = [
    R(0.099, 0.007, 0.899, 0.848, "#f4f6f8", ZONE_LINE, 2, True), T(0.2, 0.045, "FREE ZONE", 10),
    R(0.202, 0.145, 0.798, 0.708, ORANGE, "#c9875a", 2),
    L(0.401, 0.145, 0.401, 0.708, WHITE, 3), L(0.599, 0.145, 0.599, 0.708, WHITE, 3),
    L(0.5, 0.12, 0.5, 0.735, DARK, 5),
    R(0.48, 0.065, 0.52, 0.117, DARK, DARK, 2), T(0.5, 0.045, "UMPIRE", 9),
    R(0.249, 0.773, 0.368, 0.815, DARK, DARK, 2), T(0.3085, 0.794, "TEAM BENCH A", 9, WHITE, 700),
    R(0.628, 0.773, 0.746, 0.815, DARK, DARK, 2), T(0.687, 0.794, "TEAM BENCH B", 9, WHITE, 700),
]

# ---------- Sport climbing ----------
LAYOUTS["climbing"] = [
    R(0.035, 0.047, 0.97, 0.089, DARK, DARK, 2), T(0.5, 0.068, "WALL STRUCTURE", 10, WHITE, 700),
    R(0.035, 0.089, 0.97, 0.92, NONE, ZONE_LINE, 2, True),
    R(0.257, 0.14, 0.383, 0.623, "#dbeef8", "#2f86c9", 3), L(0.32, 0.14, 0.32, 0.623, "#2f86c9", 2, True), T(0.32, 0.38, "SPEED", 12, "#1f6a9c", 700),
    R(0.425, 0.14, 0.611, 0.623, "#fbe4d8", "#d9531f", 3), L(0.518, 0.14, 0.518, 0.623, "#d9531f", 2, True), T(0.518, 0.38, "LEAD", 12, "#b3471a", 700),
    R(0.649, 0.14, 0.783, 0.623, "#dcf2e8", "#16805a", 3), R(0.662, 0.484, 0.77, 0.604, "#a9dcc4", "#16805a", 2), T(0.716, 0.38, "BOULDER", 12, "#0f6a49", 700),
    R(0.061, 0.14, 0.222, 0.278, "#f7f8fa", ZONE_LINE, 2, True), T(0.14, 0.21, "ISOLATION", 10),
    R(0.809, 0.14, 0.943, 0.278, ZONE, DARK, 2), T(0.876, 0.21, "JURY", 10),
    *stand(0.235, 0.669, 0.809, 0.785, "STAGE / MATS", 12),
    R(0.035, 0.92, 0.97, 0.963, DARK, DARK, 2), T(0.5, 0.942, "TRIBUNE", 10, WHITE, 700),
]

# ---------- Badminton ----------
LAYOUTS["badminton"] = [
    R(0.213, 0.021, 0.785, 0.046, "#20408a", "#20408a", 2), T(0.5, 0.034, "MAIN TRIBUNE", 9, WHITE, 700),
    R(0.071, 0.067, 0.928, 0.931, NONE, ZONE_LINE, 2, True),
    R(0.143, 0.202, 0.857, 0.721, "#e3e9fa", "#20408a", 3),
    L(0.197, 0.202, 0.197, 0.721, "#20408a", 2, True), L(0.804, 0.202, 0.804, 0.721, "#20408a", 2, True),
    L(0.394, 0.202, 0.394, 0.721, "#20408a", 2), L(0.605, 0.202, 0.605, 0.721, "#20408a", 2),
    L(0.143, 0.46, 0.394, 0.46, "#20408a", 2), L(0.605, 0.46, 0.857, 0.46, "#20408a", 2), L(0.394, 0.46, 0.605, 0.46, "#20408a", 2),
    L(0.5, 0.177, 0.5, 0.744, DARK, 4, True),
    R(0.485, 0.125, 0.514, 0.167, "#6f7d90", DARK, 2), T(0.5, 0.1, "UMPIRE", 9),
    R(0.149, 0.74, 0.18, 0.765, DESK, ZONE_LINE, 2), R(0.817, 0.74, 0.848, 0.765, DESK, ZONE_LINE, 2),
    R(0.314, 0.775, 0.414, 0.81, DESK, ZONE_LINE, 2), T(0.364, 0.84, "SERVICE JUDGE", 9),
]

# ---------- Padel ----------
LAYOUTS["padel"] = [
    R(0.055, 0.114, 0.945, 0.886, "#f4f6f8", DARK, 2, True),
    R(0.166, 0.267, 0.836, 0.731, "#3b6fd6", "#5fb6e8", 4),
    L(0.267, 0.267, 0.267, 0.731, WHITE, 2), L(0.733, 0.267, 0.733, 0.731, WHITE, 2), L(0.267, 0.499, 0.733, 0.499, WHITE, 2),
    L(0.5, 0.255, 0.5, 0.743, WHITE, 4, True), R(0.483, 0.25, 0.517, 0.262, WHITE, DARK, 1), R(0.483, 0.737, 0.517, 0.749, WHITE, DARK, 1),
    T(0.5, 0.2, "GLASS WALLS", 10), T(0.5, 0.8, "UMPIRE", 9),
]

# ---------- Triathlon ----------
LAYOUTS["triathlon"] = [
    R(0.008, 0.006, 0.994, 0.357, WATER, NONE, 0), T(0.12, 0.05, "SWIM", 12, "#2f6f8f", 700),
    R(0.402, 0.085, 0.6, 0.164, WATER2, "#6aa7c4", 2), T(0.501, 0.125, "PONTOON / START", 10, "#1f5a77", 700),
    R(0.452, 0.241, 0.55, 0.357, "#a9d6ec", "#6aa7c4", 2), T(0.501, 0.3, "SWIM EXIT", 9, "#1f5a77", 700),
    L(0.008, 0.357, 0.994, 0.357, DARK, 3),
    R(0.315, 0.417, 0.685, 0.689, "#f4f6f8", "#8f9aaa", 2), *lanes(0.315, 0.417, 0.685, 0.689, 3, ZONE_LINE, True),
    T(0.5, 0.45, "TRANSITION AREA", 11),
    L(0.279, 0.417, 0.279, 0.689, "#e58e8e", 4), L(0.72, 0.417, 0.72, 0.689, "#e58e8e", 4), T(0.2, 0.55, "BIKE / RUN", 11),
    R(0.352, 0.73, 0.648, 0.768, "#fbf1cc", AMBER, 2), T(0.5, 0.749, "FINISH", 10, "#8a5a00", 700),
    *stand(0.069, 0.768, 0.931, 0.905, "FINISH STRAIGHT / TRIBUNE", 12),
    R(0.315, 0.929, 0.685, 0.965, "#b9bcc4", NONE, 0),
]

# ---------- Swimming ----------
LAYOUTS["swimming"] = [
    R(0.054, 0.005, 0.944, 0.995, "#f4f6f8", DARK, 2),
    R(0.109, 0.116, 0.888, 0.883, DESK, "#8f9aaa", 2),
    R(0.144, 0.171, 0.855, 0.829, "#3f9acc", DARK, 3),
    *lanes(0.144, 0.171, 0.855, 0.829, 10, WHITE, True),
    *[T(0.165, 0.171 + (0.658 / 10) * (i + 0.5), f"L{i}", 9, WHITE, 700) for i in range(10)],
    R(0.127, 0.171, 0.144, 0.829, DARK, DARK, 1), T(0.1355, 0.5, "START", 9, WHITE, 700, -90),
    R(0.855, 0.171, 0.872, 0.829, DARK, DARK, 1), T(0.8635, 0.5, "TURN", 9, WHITE, 700, 90),
    L(0.133, 0.917, 0.864, 0.917, RED, 3, True), T(0.5, 0.95, "RAIL CAMERA TRACK", 9, RED, 700),
    T(0.5, 0.06, "50 m POOL · 10 LANES", 11),
]

# ---------- Artistic swimming ----------
LAYOUTS["artistic-swimming"] = [
    *stand(0.082, 0.033, 0.916, 0.108, "MAIN TRIBUNE & JUDGES PANEL", 12),
    R(0.132, 0.155, 0.865, 0.843, DESK, DARK, 3),
    R(0.166, 0.197, 0.833, 0.733, "#b9dbee", "#2f86c9", 4),
    R(0.365, 0.286, 0.633, 0.644, NONE, "#2f86c9", 3, True), T(0.499, 0.465, "ROUTINE ZONE", 12, "#1f6a9c", 700),
    R(0.099, 0.375, 0.166, 0.553, "#cfd6df", DARK, 2), T(0.1325, 0.464, "DECK ENTRY", 9, DARK, 700, -90),
    R(0.816, 0.375, 0.841, 0.553, "#5cc3ef", "#2f86c9", 2),
    *stand(0.132, 0.866, 0.365, 0.955, "KISS & CRY", 11), *stand(0.633, 0.866, 0.865, 0.955, "AUDIO & VAR DESK", 11),
]

# ---------- Gymnastics: artistic ----------
LAYOUTS["gym-artistic"] = [
    R(0.012, 0.017, 0.99, 0.963, NONE, DARK, 3),
    R(0.055, 0.054, 0.945, 0.166, DESK, DARK, 2), R(0.166, 0.094, 0.833, 0.129, DARK, DARK, 1), T(0.5, 0.111, "VAULT RUNWAY", 10, WHITE, 700),
    R(0.055, 0.203, 0.3, 0.758, DESK, DARK, 2), T(0.1775, 0.48, "POMMEL HORSE", 11, DARK, 700), T(0.1775, 0.53, "+ RINGS", 11, DARK, 700),
    R(0.335, 0.203, 0.666, 0.758, DESK, DARK, 2), R(0.351, 0.231, 0.65, 0.73, "#f4dcd8", RED, 2, True), T(0.5, 0.48, "FLOOR", 13, DARK, 700),
    R(0.7, 0.203, 0.945, 0.758, DESK, DARK, 2), T(0.8225, 0.48, "PARALLEL BARS", 11, DARK, 700), T(0.8225, 0.53, "+ HIGH / UNEVEN BARS", 10, DARK, 700),
    *stand(0.055, 0.915, 0.945, 0.955, "MAIN TRIBUNE (180° ACTION AXIS)", 11),
]

# ---------- Gymnastics: rhythmic & acrobatic ----------
LAYOUTS["gym-rhythmic"] = [
    R(0.077, 0.023, 0.923, 0.047, DARK, DARK, 1), T(0.5, 0.035, "MAIN TRIBUNE (180° ACTION AXIS)", 10, WHITE, 700),
    R(0.038, 0.055, 0.962, 0.945, NONE, ZONE_LINE, 2, True),
    *stand(0.268, 0.089, 0.73, 0.144, "JURY & JUDGES PANEL", 11),
    R(0.268, 0.272, 0.73, 0.94, NONE, ZONE_LINE, 2, True),
    R(0.308, 0.333, 0.694, 0.888, "#fdf0ea", "#e2621f", 4), T(0.501, 0.62, "13 m × 13 m CARPET", 12, "#c4521a", 700),
    R(0.062, 0.711, 0.2, 0.888, "#fdecec", RED, 2), T(0.131, 0.8, "KISS & CRY", 11, RED, 700),
    R(0.826, 0.333, 0.941, 0.667, "#f7f8fa", "#8f9aaa", 2), T(0.8835, 0.5, "APPARATUS", 10, TEXT, 700, 90),
]

# ---------- Gymnastics: trampoline ----------
LAYOUTS["gym-trampoline"] = [
    R(0.059, 0.077, 0.94, 0.918, "#f7f8fa", ZONE_LINE, 2, True),
    R(0.759, 0.131, 0.899, 0.249, "#fdf2cc", AMBER, 3), T(0.829, 0.19, "KISS & CRY", 10, "#8a5a00", 700),
    R(0.259, 0.287, 0.741, 0.709, "#e1e7ee", "#8f9aaa", 3), T(0.5, 0.32, "SAFETY PLATFORM", 10),
    R(0.317, 0.339, 0.681, 0.659, "#2c3b52", DARK, 6), R(0.343, 0.37, 0.655, 0.628, "#3a4d68", WHITE, 3),
    L(0.499, 0.37, 0.499, 0.628, WHITE, 2, True), T(0.5, 0.5, "TRAMPOLINE", 12, WHITE, 700),
    R(0.298, 0.873, 0.7, 0.937, WHITE, DARK, 3), T(0.499, 0.905, "JUDGES", 11, DARK, 700),
    L(0.099, 0.965, 0.899, 0.965, RED, 4),
]

# ---------- Gymnastics: aerobic ----------
LAYOUTS["gym-aerobic"] = [
    R(0.027, 0.039, 0.971, 0.961, NONE, DARK, 3),
    R(0.213, 0.05, 0.785, 0.079, "#e8ecf8", "#20408a", 2), T(0.499, 0.0645, "MAIN TRIBUNE & JUDGES (180° AXIS)", 9, "#20408a", 700),
    R(0.113, 0.084, 0.257, 0.128, "#f4f6f8", DARK, 2), T(0.185, 0.106, "ENTRANCE", 9, DARK, 700),
    R(0.327, 0.277, 0.671, 0.76, "#f6e2cc", "#c0601a", 4), R(0.356, 0.316, 0.643, 0.72, NONE, RED, 2, True),
    R(0.4, 0.378, 0.6, 0.659, "#f6e2cc", DARK, 2), C(0.5, 0.519, 0.004, DARK, DARK, 1), T(0.5, 0.345, "COMPETITION AREA", 10, "#a4521a", 700),
    *stand(0.356, 0.796, 0.643, 0.831, "JURY & JUDGES PANELS", 10),
    R(0.771, 0.796, 0.914, 0.881, "#fdf2cc", AMBER, 2), T(0.8425, 0.84, "KISS & CRY", 10, "#8a5a00", 700),
]

# ---------- Weightlifting ----------
LAYOUTS["weightlifting"] = [
    R(0.062, 0.002, 0.937, 0.909, NONE, DARK, 3),
    *stand(0.374, 0.074, 0.625, 0.139, "JURY & REFEREES", 11),
    R(0.404, 0.236, 0.594, 0.51, "#f2dcc8", "#b5561c", 3), R(0.437, 0.286, 0.561, 0.46, "#8b5a3c", WHITE, 2),
    L(0.415, 0.375, 0.583, 0.375, DARK, 5), R(0.432, 0.345, 0.443, 0.405, RED, RED, 1), R(0.555, 0.345, 0.566, 0.405, RED, RED, 1),
    T(0.499, 0.43, "PLATFORM", 10, WHITE, 700),
    R(0.404, 0.567, 0.594, 0.637, NONE, ZONE_LINE, 2, True), T(0.499, 0.602, "LOADING AREA", 9),
    *stand(0.099, 0.709, 0.275, 0.856, "WARM-UP", 11), *stand(0.725, 0.709, 0.899, 0.856, "KISS & CRY / COACH", 10),
]

# ---------- Taekwondo / Karate ----------
LAYOUTS["taekwondo"] = [
    *stand(0.213, 0.039, 0.785, 0.099, "TRIBUNE", 11), *stand(0.385, 0.119, 0.614, 0.169, "REFEREES / VIDEO", 9),
    R(0.157, 0.36, 0.242, 0.56, ZONE, DARK, 2), T(0.1995, 0.46, "COACHES", 9, TEXT, 700, -90),
    R(0.356, 0.259, 0.643, 0.661, "#f7f8fa", "#8f9aaa", 2, True),
    P(octagon(0.356, 0.259, 0.643, 0.661), "#f6dcdc", RED, 4),
    C(0.478, 0.459, 0.009, BLUE, BLUE, 1), C(0.521, 0.459, 0.009, RED, RED, 1), T(0.5, 0.56, "COMPETITION AREA", 10, "#a8302a", 700),
    R(0.285, 0.61, 0.335, 0.66, MAT_B, BLUE, 2), R(0.688, 0.259, 0.738, 0.308, MAT_R, RED, 2),
]

# ---------- Squash ----------
LAYOUTS["squash"] = [
    R(0.013, 0.012, 0.983, 0.678, "#f4f6f8", DARK, 3), L(0.013, 0.012, 0.983, 0.012, DARK, 8), T(0.5, 0.06, "FRONT WALL", 10, DARK, 700),
    L(0.013, 0.372, 0.983, 0.372, DARK, 2), T(0.62, 0.355, "SHORT LINE", 9),
    L(0.485, 0.372, 0.485, 0.678, DARK, 2),
    R(0.255, 0.372, 0.485, 0.614, NONE, DARK, 2, True), R(0.485, 0.372, 0.716, 0.614, NONE, DARK, 2, True),
    T(0.37, 0.5, "SERVICE BOX", 9), T(0.6, 0.5, "SERVICE BOX", 9),
    L(0.4, 0.678, 0.55, 0.678, "#8fd3f0", 5), T(0.5, 0.71, "GLASS BACK WALL / DOOR", 9),
    R(0.157, 0.736, 0.243, 0.779, DESK, DARK, 2), T(0.2, 0.7575, "COACH", 9, DARK, 700),
    R(0.751, 0.736, 0.837, 0.779, DESK, DARK, 2), T(0.794, 0.7575, "COACH", 9, DARK, 700),
    *stand(0.013, 0.909, 0.983, 0.969, "MAIN TRIBUNE & REFEREE / VIDEO DESK", 11),
]

# ---------- Boxing ----------
LAYOUTS["boxing"] = [
    R(0.132, 0.133, 0.865, 0.867, NONE, ZONE_LINE, 2, True),
    R(0.272, 0.272, 0.727, 0.727, "#eef0f3", ZONE_LINE, 2),
    R(0.299, 0.30, 0.699, 0.70, RING, DARK, 4), T(0.499, 0.5, "RING", 14, "#a8504a", 700),
    C(0.299, 0.30, 0.022, RED, DARK, 3), C(0.699, 0.70, 0.022, BLUE, DARK, 3),
    C(0.699, 0.30, 0.022, "#8a94a3", DARK, 3), C(0.299, 0.70, 0.022, "#8a94a3", DARK, 3),
    *stand(0.36, 0.765, 0.64, 0.815, "JUDGES & TIMEKEEPER", 10),
]

# ---------- Muaythai / Kickboxing ----------
LAYOUTS["muaythai"] = [
    R(0.041, 0.049, 0.959, 0.951, NONE, ZONE_LINE, 2, True),
    R(0.169, 0.086, 0.831, 0.911, "#eef0f3", ZONE_LINE, 3),
    R(0.222, 0.149, 0.777, 0.848, ORANGE, "#c9875a", 3),
    L(0.4995, 0.149, 0.4995, 0.848, WHITE, 2, True), L(0.222, 0.4985, 0.777, 0.4985, WHITE, 2, True), C(0.4995, 0.4985, 0.071, NONE, WHITE, 2),
    C(0.222, 0.149, 0.016, RED, DARK, 2), C(0.777, 0.848, 0.016, BLUE, DARK, 2),
    C(0.777, 0.149, 0.016, "#8a94a3", DARK, 2), C(0.222, 0.848, 0.016, "#8a94a3", DARK, 2),
    R(0.359, 0.918, 0.639, 0.977, DESK, "#8f9aaa", 2), T(0.499, 0.9475, "JUDGES & TIMEKEEPER", 10),
]

# ---------- Shooting ----------
LAYOUTS["shooting"] = [
    R(0.06, 0.078, 0.942, 0.918, "#f7f8fa", DARK, 4),
    R(0.108, 0.12, 0.893, 0.254, "#f4f6f8", "#8f9aaa", 2, True), T(0.5, 0.187, "SPECTATOR TRIBUNE & JURY", 11, DARK, 700),
    R(0.108, 0.308, 0.893, 0.851, "#eef1f5", DARK, 2),
    L(0.157, 0.389, 0.843, 0.389, DARK, 4), T(0.5, 0.35, "FIRING LINE (10 m / 25 m / 50 m)", 11, DARK, 700),
    R(0.157, 0.471, 0.843, 0.661, NONE, "#8f9aaa", 2, True), T(0.5, 0.57, "ATHLETE STAGING & EQUIPMENT", 10),
    L(0.157, 0.768, 0.843, 0.768, RED, 4), T(0.5, 0.81, "TARGETS (ELECTRONIC TARGET SYSTEM)", 10, RED, 700),
]

# ---------- Modern pentathlon (union of the three slide images) ----------
LAYOUTS["pentathlon"] = [
    R(0.01, 0.01, 0.99, 0.99, "#f7f8fa", ZONE_LINE, 2, rx=10),
    R(0.033, 0.049, 0.444, 0.42, "#fbf1d2", AMBER, 2, True), T(0.2385, 0.09, "OBSTACLE ARENA", 11, "#a0600a", 700),
    *[R(u, v, u + 0.065, v + 0.016, "#d97a1c", NONE, 0) for u, v in ((0.08, 0.17), (0.21, 0.205), (0.34, 0.17), (0.14, 0.31), (0.27, 0.33))],
    A(0.2385, 0.42, 0.155, 180, 360, AMBER, 2, True),
    R(0.465, 0.049, 0.962, 0.42, "#e5f6ec", "#2f9a5a", 2, True), T(0.6, 0.09, "FENCING (BONUS ROUND)", 11, "#1f7a44", 700),
    *[R(0.497, v, 0.692, v + 0.02, "#c4ccd6", DARK, 1) for v in (0.13, 0.22, 0.31)],
    *[L(0.5945, v, 0.5945, v + 0.02, RED, 2) for v in (0.13, 0.22, 0.31)],
    R(0.736, 0.174, 0.931, 0.264, "#d8f5e3", "#2f9a5a", 2), T(0.8335, 0.219, "REFEREE & VAR", 10, "#1f7a44", 700),
    R(0.03, 0.464, 0.482, 0.702, "#eaf5fb", "#2f86c9", 2, True), T(0.256, 0.49, "SWIMMING (200 m)", 11, "#1f6a9c", 700),
    R(0.052, 0.512, 0.46, 0.67, "#b9dbee", "#2f86c9", 2), L(0.052, 0.591, 0.46, 0.591, AMBER, 2), *lanes(0.052, 0.512, 0.46, 0.67, 4, WHITE, True),
    R(0.498, 0.464, 0.962, 0.972, "#eef3fb", "#2a5aa8", 2, True), T(0.73, 0.49, "LASER RUN", 11, "#2a5aa8", 700),
    R(0.519, 0.532, 0.757, 0.579, "#dbe7fb", "#2a5aa8", 2), T(0.638, 0.5555, "LASER RANGE", 9, "#2a5aa8", 700),
    R(0.519, 0.618, 0.94, 0.944, NONE, "#2a5aa8", 3, rxh=0.18),
    L(0.85, 0.72, 0.85, 0.85, RED, 4), R(0.82, 0.705, 0.88, 0.725, RED, RED, 1), T(0.85, 0.715, "FINISH", 8, WHITE, 700),
]

# ---------- Canoe sprint ----------
LAYOUTS["canoe"] = [
    R(0.011, 0.01, 0.989, 0.99, "#f7f8fa", ZONE_LINE, 2, rx=8),
    R(0.073, 0.08, 0.926, 0.917, "#dcebf7", "#2f86c9", 3),
    *lanes(0.073, 0.08, 0.926, 0.917, 9, "#7fb2d6", True),
    L(0.287, 0.08, 0.287, 0.917, "#8f9aaa", 1, True), L(0.5, 0.08, 0.5, 0.917, AMBER, 2, True), L(0.713, 0.08, 0.713, 0.917, "#8f9aaa", 1, True),
    R(0.048, 0.08, 0.068, 0.917, DARK, DARK, 1), L(0.073, 0.08, 0.073, 0.917, RED, 3), L(0.926, 0.08, 0.926, 0.917, RED, 4),
    T(0.09, 0.05, "START", 10, RED, 700), T(0.287, 0.05, "750 m", 10), T(0.5, 0.05, "500 m", 10, AMBER, 700), T(0.713, 0.05, "250 m", 10),
    T(0.91, 0.05, "FINISH", 10, RED, 700),
    L(0.073, 0.942, 0.9, 0.942, "#2f86c9", 2, True), T(0.5, 0.965, "CAMERA CATWALK / TRACKING", 9, "#2f86c9", 700),
    R(0.904, 0.929, 0.977, 0.993, DARK, DARK, 1), T(0.9405, 0.961, "TOWER", 8, WHITE, 700),
]
