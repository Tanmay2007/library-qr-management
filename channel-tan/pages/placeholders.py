"""
pages/placeholders.py - Elegant placeholder views for upcoming sections.

Covers:
- 02 / ABOUT
- 03 / SKILLS
- 04 / ACHIEVEMENTS
- 05 / EDUCATION
- 06 / CONTACT

Maintains the editorial, analogue vinyl archive aesthetic while indicating
active curation status for subsequent milestones.
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
    FONT_TITLE_LARGE,
    FONT_EDITORIAL_ITALIC,
    FONT_BODY,
    FONT_MONO_TAG,
    FONT_MONO_BOLD,
)


SECTION_DESCRIPTIONS = {
    "02 / ABOUT": (
        "Personal narrative, engineering philosophy, and creative background. "
        "Exploring the intersection of software development, sound curation, "
        "and analogue photography."
    ),
    "03 / SKILLS": (
        "Technical proficiency catalog spanning Python, system architectures, "
        "algorithms, full-stack frameworks, database design, and visual styling systems."
    ),
    "04 / ACHIEVEMENTS": (
        "Selected accolades, hackathon awards, academic distinctions, "
        "and published technical milestones curated from college coursework."
    ),
    "05 / EDUCATION": (
        "Academic credentials in Computer Science, university coursework milestones, "
        "technical certifications, and foundational curriculum highlights."
    ),
    "06 / CONTACT": (
        "Direct communication channels, verified GitHub archives, LinkedIn profile, "
        "and public cryptographic verification keys."
    ),
}


class PlaceholderPage(tk.Frame):
    """
    Standardized placeholder view for sections awaiting complete content.
    Demonstrates layout consistency and clean typography for viva presentation.
    """

    def __init__(self, parent, section_name):
        super().__init__(parent, bg=BG_MAIN)
        self.section_name = section_name

        # Parse number and label if present
        parts = section_name.split(" / ")
        sec_num = parts[0] if len(parts) > 1 else "ARCHIVE"
        sec_title = parts[1] if len(parts) > 1 else section_name

        # Outer padding container
        container = tk.Frame(self, bg=BG_MAIN)
        container.pack(fill=tk.BOTH, expand=True, padx=50, pady=40)

        # 1. Section Header Badge
        header_frame = tk.Frame(container, bg=BG_MAIN)
        header_frame.pack(anchor="w", pady=(0, 6))

        tag_dot = tk.Label(header_frame, text="●", font=FONT_MONO_TAG, fg=ACCENT_PINK, bg=BG_MAIN)
        tag_dot.pack(side=tk.LEFT, padx=(0, 6))

        sec_label = tk.Label(
            header_frame,
            text=f"ARCHIVE CATALOG ENTRY // SECTION {sec_num}",
            font=FONT_MONO_TAG,
            fg=ACCENT_OLIVE,
            bg=BG_MAIN,
        )
        sec_label.pack(side=tk.LEFT)

        # 2. Main Section Title
        title_label = tk.Label(
            container,
            text=sec_title,
            font=FONT_TITLE_LARGE,
            fg=TEXT_PRIMARY,
            bg=BG_MAIN,
            anchor="w",
        )
        title_label.pack(anchor="w", pady=(0, 16))

        # 3. Dividing Line
        rule = tk.Frame(container, bg=BORDER_COLOR, height=1)
        rule.pack(fill=tk.X, pady=(0, 24))

        # 4. Editorial Dossier Card
        card = tk.Frame(
            container,
            bg=BG_SECONDARY,
            padx=30,
            pady=26,
            highlightbackground=BORDER_COLOR,
            highlightthickness=1,
        )
        card.pack(anchor="w", fill=tk.X, pady=(0, 24))

        status_lbl = tk.Label(
            card,
            text="[ CURATION IN PROGRESS — MILESTONE 2 ]",
            font=FONT_MONO_BOLD,
            fg=ACCENT_ORANGE,
            bg=BG_SECONDARY,
        )
        status_lbl.pack(anchor="w", pady=(0, 10))

        description = SECTION_DESCRIPTIONS.get(
            section_name,
            "Detailed documentation for this archive section will be loaded in the next milestone."
        )

        desc_lbl = tk.Label(
            card,
            text=description,
            font=FONT_BODY,
            fg=TEXT_PRIMARY,
            bg=BG_SECONDARY,
            wraplength=640,
            justify="left",
        )
        desc_lbl.pack(anchor="w", pady=(0, 14))

        note_lbl = tk.Label(
            card,
            text="The navigation framework, state switcher, and layout coordinates are fully active.",
            font=FONT_EDITORIAL_ITALIC,
            fg=TEXT_SECONDARY,
            bg=BG_SECONDARY,
        )
        note_lbl.pack(anchor="w")

        # 5. Metadata Footer
        meta_frame = tk.Frame(container, bg=BG_MAIN)
        meta_frame.pack(anchor="w", pady=(10, 0))

        meta_txt = tk.Label(
            meta_frame,
            text=f"SPEC: TKINTER CONTAINER FRAME • VIEW: pages/placeholders.py • ROUTE: {section_name}",
            font=FONT_MONO_TAG,
            fg=TEXT_MUTED,
            bg=BG_MAIN,
        )
        meta_txt.pack(anchor="w")
