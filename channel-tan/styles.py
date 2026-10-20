"""
styles.py - Design tokens and styling configurations for CHANNEL TAN.

Inspired by Frank Ocean's Blonde, alternative R&B, analogue vinyl culture,
and editorial graphic design.
"""

# ---------------------------------------------------------------------------
# COLOR PALETTE
# ---------------------------------------------------------------------------
BG_MAIN = "#20201E"         # Deep warm ash / main application canvas
BG_SECONDARY = "#292925"    # Subtle elevated surface (sidebar, cards, decks)
BG_SURFACE = "#32322D"      # Secondary elevation (artwork backing, active tabs)
BORDER_COLOR = "#3D3D37"    # Muted hair-line dividers

TEXT_PRIMARY = "#EAE4D8"    # Warm parchment cream / main editorial text
TEXT_SECONDARY = "#A6A39B"  # Muted silver-grey / metadata & captions
TEXT_MUTED = "#6E6D66"      # Deep muted grey for track numbers & subtle tags

ACCENT_OLIVE = "#7C8060"    # Muted olive green
ACCENT_PINK = "#C58F91"     # Dusty rose pink
ACCENT_ORANGE = "#C66B43"   # Burnt terracotta orange

# ---------------------------------------------------------------------------
# TYPOGRAPHY
# ---------------------------------------------------------------------------
# Serif for editorial headings (Georgia is universally available on macOS/cross-platform)
FONT_HERO = ("Georgia", 32, "bold")
FONT_TITLE_LARGE = ("Georgia", 22, "bold")
FONT_TITLE = ("Georgia", 18, "bold")
FONT_TITLE_MEDIUM = ("Georgia", 14, "bold")
FONT_EDITORIAL_ITALIC = ("Georgia", 12, "italic")

# Sans-serif for clean interface elements and supporting body
FONT_NAV = ("Helvetica Neue", 11, "bold")
FONT_NAV_INACTIVE = ("Helvetica Neue", 11, "normal")
FONT_BODY = ("Helvetica Neue", 11, "normal")
FONT_BODY_BOLD = ("Helvetica Neue", 11, "bold")
FONT_BODY_MUTED = ("Helvetica Neue", 10, "normal")

# Monospace for archive indexes, timecodes, and metadata tags
FONT_MONO_TAG = ("Menlo", 9, "normal")
FONT_MONO_BOLD = ("Menlo", 9, "bold")
FONT_MONO_PLAYER = ("Menlo", 10, "normal")

# ---------------------------------------------------------------------------
# DIMENSIONS & SIZING
# ---------------------------------------------------------------------------
WINDOW_WIDTH = 1150
WINDOW_HEIGHT = 760
MIN_WIDTH = 980
MIN_HEIGHT = 640
SIDEBAR_WIDTH = 220
