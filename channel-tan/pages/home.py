"""
pages/home.py - The home screen view for CHANNEL TAN.

Features:
- Editorial layout introducing Tanmay Rai as a CS student and developer.
- Concise thesis on bridging technology and understated creativity.
- Navigation action buttons ("EXPLORE ACHIEVEMENTS" and "ABOUT ME").
- Original procedural vector artwork rendered on a Tkinter Canvas,
  inspired by analogue vinyl record packaging, color test strips,
  and alternative R&B album sleeves.
"""

import tkinter as tk
from styles import (
    BG_MAIN,
    BG_SECONDARY,
    BG_SURFACE,
    BORDER_COLOR,
    TEXT_PRIMARY,
    TEXT_SECONDARY,
    TEXT_MUTED,
    ACCENT_OLIVE,
    ACCENT_PINK,
    ACCENT_ORANGE,
    FONT_HERO,
    FONT_TITLE_LARGE,
    FONT_TITLE,
    FONT_TITLE_MEDIUM,
    FONT_EDITORIAL_ITALIC,
    FONT_BODY,
    FONT_BODY_BOLD,
    FONT_BODY_MUTED,
    FONT_NAV,
    FONT_MONO_TAG,
    FONT_MONO_BOLD,
)


class HomePage(tk.Frame):
    """
    Home page component.
    Inherits from standard Tkinter Frame.
    """

    def __init__(self, parent, navigate_callback):
        super().__init__(parent, bg=BG_MAIN)
        self.navigate_callback = navigate_callback

        # Container frame for margins and responsive alignment
        self.container = tk.Frame(self, bg=BG_MAIN)
        self.container.pack(fill=tk.BOTH, expand=True, padx=40, pady=30)

        # Build two-column layout: Left (Editorial Bio), Right (Analogue Canvas Art)
        self._build_left_editorial_column()
        self._build_right_artwork_column()

    def _build_left_editorial_column(self):
        """Constructs the left typographic dossier and call-to-action buttons."""
        left_col = tk.Frame(self.container, bg=BG_MAIN)
        left_col.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 30))

        # 1. Archive Index Tag
        tag_frame = tk.Frame(left_col, bg=BG_MAIN)
        tag_frame.pack(anchor="w", pady=(0, 10))

        tag_dot = tk.Label(tag_frame, text="●", font=FONT_MONO_TAG, fg=ACCENT_ORANGE, bg=BG_MAIN)
        tag_dot.pack(side=tk.LEFT, padx=(0, 6))

        tag_text = tk.Label(
            tag_frame,
            text="ARCHIVE DOSSIER // VOL. 01 — 2026",
            font=FONT_MONO_TAG,
            fg=ACCENT_OLIVE,
            bg=BG_MAIN,
        )
        tag_text.pack(side=tk.LEFT)

        # 2. Main Hero Heading
        hero_title = tk.Label(
            left_col,
            text="TANMAY RAI",
            font=FONT_HERO,
            fg=TEXT_PRIMARY,
            bg=BG_MAIN,
            anchor="w",
        )
        hero_title.pack(anchor="w", pady=(0, 4))

        # 3. Sub-heading: Role
        role_label = tk.Label(
            left_col,
            text="Computer Science Student & Software Developer",
            font=FONT_EDITORIAL_ITALIC,
            fg=ACCENT_PINK,
            bg=BG_MAIN,
            anchor="w",
        )
        role_label.pack(anchor="w", pady=(0, 18))

        # 4. Thin Editorial Divider
        divider = tk.Frame(left_col, bg=BORDER_COLOR, height=1)
        divider.pack(fill=tk.X, pady=(0, 18))

        # 5. Narrative Bio / Creative Concept Statement
        bio_text = (
            "Building robust software systems through the lens of thoughtful, "
            "understated design. Driven by core computer science principles, "
            "modular architecture, and the warm, tactile aesthetic of analogue archives."
        )
        bio_label = tk.Label(
            left_col,
            text=bio_text,
            font=FONT_BODY,
            fg=TEXT_SECONDARY,
            bg=BG_MAIN,
            wraplength=460,
            justify="left",
        )
        bio_label.pack(anchor="w", pady=(0, 24))

        # 6. Secondary Spec Note (College Portfolio Stamp)
        spec_frame = tk.Frame(left_col, bg=BG_SECONDARY, padx=14, pady=10)
        spec_frame.pack(anchor="w", fill=tk.X, pady=(0, 26))

        spec_header = tk.Label(
            spec_frame,
            text="CORE SPECIALISATIONS",
            font=FONT_MONO_BOLD,
            fg=ACCENT_ORANGE,
            bg=BG_SECONDARY,
        )
        spec_header.pack(anchor="w", pady=(0, 4))

        spec_body = tk.Label(
            spec_frame,
            text="Python Architecture • Data Structures • Desktop Systems • Creative Engineering",
            font=FONT_BODY_MUTED,
            fg=TEXT_PRIMARY,
            bg=BG_SECONDARY,
        )
        spec_body.pack(anchor="w")

        # 7. Action Navigation Buttons
        btn_container = tk.Frame(left_col, bg=BG_MAIN)
        btn_container.pack(anchor="w", pady=(6, 0))

        # Primary Button: EXPLORE ACHIEVEMENTS
        self.btn_achievements = tk.Button(
            btn_container,
            text="EXPLORE ACHIEVEMENTS  →",
            font=FONT_NAV,
            bg=ACCENT_ORANGE,
            fg=TEXT_PRIMARY,
            activebackground="#D97A52",
            activeforeground=TEXT_PRIMARY,
            relief=tk.FLAT,
            bd=0,
            padx=18,
            pady=9,
            cursor="hand2",
            command=lambda: self.navigate_callback("04 / ACHIEVEMENTS"),
        )
        self.btn_achievements.pack(side=tk.LEFT, padx=(0, 14))

        # Secondary Button: ABOUT ME
        self.btn_about = tk.Button(
            btn_container,
            text="ABOUT ME",
            font=FONT_NAV,
            bg=BG_SECONDARY,
            fg=TEXT_PRIMARY,
            activebackground=BG_SURFACE,
            activeforeground=TEXT_PRIMARY,
            relief=tk.FLAT,
            bd=0,
            padx=18,
            pady=9,
            cursor="hand2",
            highlightbackground=BORDER_COLOR,
            highlightthickness=1,
            command=lambda: self.navigate_callback("02 / ABOUT"),
        )
        self.btn_about.pack(side=tk.LEFT)

    def _build_right_artwork_column(self):
        """
        Renders an original procedural vector artwork on a Tkinter Canvas.
        Inspired by physical 12-inch vinyl jackets, photographic color grading
        bars, and alternative R&B editorial layouts.
        """
        right_col = tk.Frame(self.container, bg=BG_MAIN)
        right_col.pack(side=tk.RIGHT, fill=tk.BOTH, expand=False, padx=(10, 0))

        # Outer canvas dimensions
        canvas_w = 380
        canvas_h = 390
        canvas = tk.Canvas(
            right_col,
            width=canvas_w,
            height=canvas_h,
            bg=BG_MAIN,
            highlightthickness=0,
            bd=0,
        )
        canvas.pack(anchor="center")

        # 1. Analogue Sleeve Outer Box (Cardstock jacket)
        jacket_x1, jacket_y1 = 20, 20
        jacket_x2, jacket_y2 = 360, 360
        canvas.create_rectangle(
            jacket_x1, jacket_y1, jacket_x2, jacket_y2,
            fill=BG_SECONDARY,
            outline=BORDER_COLOR,
            width=1.5,
        )

        # 2. Vinyl Record Outer Disc (Peeking/centered aesthetic)
        disc_cx, disc_cy = 190, 185
        disc_r = 145
        canvas.create_oval(
            disc_cx - disc_r, disc_cy - disc_r,
            disc_cx + disc_r, disc_cy + disc_r,
            fill="#181816",
            outline=BG_SURFACE,
            width=1.5,
        )

        # 3. Concentric Vinyl Grooves (Subtle tactile sound rings)
        for r_step in [130, 115, 100, 85, 72]:
            canvas.create_oval(
                disc_cx - r_step, disc_cy - r_step,
                disc_cx + r_step, disc_cy + r_step,
                outline="#252522",
                width=1,
            )

        # 4. Analogue Color Test Strip (Frank Ocean / Boys Don't Cry editorial style)
        # Vertical strip on the left margin of the sleeve
        strip_x = 34
        strip_w = 9
        canvas.create_rectangle(strip_x, 34, strip_x + strip_w, 100, fill=ACCENT_ORANGE, outline="")
        canvas.create_rectangle(strip_x, 100, strip_x + strip_w, 166, fill=ACCENT_PINK, outline="")
        canvas.create_rectangle(strip_x, 166, strip_x + strip_w, 232, fill=ACCENT_OLIVE, outline="")
        canvas.create_rectangle(strip_x, 232, strip_x + strip_w, 298, fill=TEXT_PRIMARY, outline="")

        # 5. Center Vinyl Record Label
        label_r = 52
        canvas.create_oval(
            disc_cx - label_r, disc_cy - label_r,
            disc_cx + label_r, disc_cy + label_r,
            fill=BG_MAIN,
            outline=ACCENT_OLIVE,
            width=2,
        )

        # Label Center Spindle Hole
        hole_r = 7
        canvas.create_oval(
            disc_cx - hole_r, disc_cy - hole_r,
            disc_cx + hole_r, disc_cy + hole_r,
            fill="#0D0D0C",
            outline=BORDER_COLOR,
            width=1,
        )

        # 6. Typography on the Record Label
        canvas.create_text(
            disc_cx, disc_cy - 26,
            text="CHANNEL TAN",
            font=("Georgia", 8, "bold"),
            fill=TEXT_PRIMARY,
        )
        canvas.create_text(
            disc_cx, disc_cy - 14,
            text="SIDE A // 33⅓ RPM",
            font=("Menlo", 6, "normal"),
            fill=ACCENT_PINK,
        )
        canvas.create_text(
            disc_cx, disc_cy + 18,
            text="STEREO ARCHIVE",
            font=("Menlo", 6, "normal"),
            fill=TEXT_SECONDARY,
        )
        canvas.create_text(
            disc_cx, disc_cy + 29,
            text="TAN-2026",
            font=("Menlo", 7, "bold"),
            fill=ACCENT_ORANGE,
        )

        # 7. Editorial Sleeve Annotations (Outer border notations)
        canvas.create_text(
            52, 346,
            text="ORIGINAL SLEEVE / NO. 001",
            anchor="w",
            font=("Menlo", 7, "normal"),
            fill=TEXT_MUTED,
        )
        canvas.create_text(
            346, 346,
            text="HIGH FIDELITY CS",
            anchor="e",
            font=("Menlo", 7, "normal"),
            fill=TEXT_MUTED,
        )
        canvas.create_text(
            346, 32,
            text="BLONDE ERA INFLUENCE",
            anchor="e",
            font=("Georgia", 7, "italic"),
            fill=ACCENT_OLIVE,
        )
