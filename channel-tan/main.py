"""
main.py - Entry point and root application shell for CHANNEL TAN.

Architecture:
- Inherits from tk.Tk (main application window).
- Uses Tkinter Frame layout managers (pack and grid) rather than absolute coordinates.
- Houses top Header, persistent Sidebar, dynamic Content Area,
  fixed BLONDE RADIO music deck, and minimal Footer.
- Manages single-window frame-switching navigation for all 6 sections.
"""

import os
import sys
import json
import threading
import subprocess
import tkinter as tk
from tkinter import ttk, messagebox

# Ensure the script directory is in sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)


class SoundCloudBridge:
    """
    Inter-Process Communication (IPC) bridge between Tkinter and the
    background macOS WebKit audio engine (soundcloud_player.py).
    
    Architecture / College Viva Explanation:
    - Standard Tkinter cannot embed modern HTML5 WebAudio or run the SoundCloud Widget JS.
    - To prevent launching external browser windows (Safari/Chrome/Spotify) or freezing
      the Tkinter GUI thread, the audio engine runs in a dedicated background subprocess.
    - This class manages the subprocess lifecycle, sends downstream playback commands
      (PLAY, PAUSE, SEEK, QUIT) via stdin, and reads upstream JSON telemetry (READY,
      PLAY, PAUSE, PROGRESS, ERROR) via stdout.
    """

    def __init__(self, on_event_callback):
        self.on_event_callback = on_event_callback
        self.process = None
        self.reader_thread = None
        self._start_engine()

    def _start_engine(self):
        engine_script = os.path.join(SCRIPT_DIR, "soundcloud_player.py")
        try:
            self.process = subprocess.Popen(
                [sys.executable, engine_script],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
            )
            self.reader_thread = threading.Thread(target=self._read_stdout, daemon=True)
            self.reader_thread.start()
        except Exception as e:
            self.on_event_callback({"event": "ERROR", "msg": str(e)})

    def _read_stdout(self):
        """Continuously reads newline-delimited JSON telemetry from the audio engine."""
        if not self.process or not self.process.stdout:
            return
        for line in self.process.stdout:
            clean_line = line.strip()
            if not clean_line:
                continue
            try:
                data = json.loads(clean_line)
                self.on_event_callback(data)
            except Exception:
                pass

    def send_command(self, cmd):
        """Dispatches a command string over stdin to soundcloud_player.py."""
        if self.process and self.process.stdin:
            try:
                self.process.stdin.write(cmd + "\n")
                self.process.stdin.flush()
            except Exception:
                pass

    def shutdown(self):
        """Cleanly terminates the WebKit background audio engine."""
        self.send_command("QUIT")
        if self.process:
            try:
                self.process.terminate()
            except Exception:
                pass

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
    FONT_TITLE_MEDIUM,
    FONT_BODY,
    FONT_BODY_BOLD,
    FONT_BODY_MUTED,
    FONT_NAV,
    FONT_NAV_INACTIVE,
    FONT_MONO_TAG,
    FONT_MONO_BOLD,
    FONT_MONO_PLAYER,
    WINDOW_WIDTH,
    WINDOW_HEIGHT,
    MIN_WIDTH,
    MIN_HEIGHT,
    SIDEBAR_WIDTH,
)
from pages.home import HomePage
from pages.placeholders import PlaceholderPage


SECTIONS = [
    "01 / HOME",
    "02 / ABOUT",
    "03 / SKILLS",
    "04 / ACHIEVEMENTS",
    "05 / EDUCATION",
    "06 / CONTACT",
]


class ChannelTanApp(tk.Tk):
    """
    Primary application window controller.
    Coordinates global layout, navigation routing, and audio deck status.
    """

    def __init__(self):
        super().__init__()

        # 1. Window Configuration
        self.title("CHANNEL TAN — Personal Portfolio Archive")
        self.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}")
        self.minsize(MIN_WIDTH, MIN_HEIGHT)
        self.configure(bg=BG_MAIN)

        # Center the desktop window on the user's screen
        self._center_window(WINDOW_WIDTH, WINDOW_HEIGHT)

        # 2. Navigation State Tracking
        self.current_section = None
        self.nav_widgets = {}   # Maps section_name -> {container, indicator, label}
        self.pages = {}         # Cached page frame instances: section_name -> Frame

        # 3. Audio Deck State Tracking (Blonde Radio)
        self.is_playing = False
        self.current_track = {
            "title": "Ivy",
            "artist": "Frank Ocean",
            "duration": "03:45",
            "progress": "00:00",
            "pct": 0.0,
        }

        # 4. Build Component Hierarchy
        self._build_header()
        self._build_bottom_deck()
        self._build_body()

        # 5. Initialize SoundCloud WebKit Audio Bridge & App Teardown
        self.sc_bridge = SoundCloudBridge(self._on_sc_event_threadsafe)
        self.protocol("WM_DELETE_WINDOW", self._on_close)

        # 6. Default Route
        self.navigate_to("01 / HOME")

    def _center_window(self, width, height):
        """Calculates screen dimensions to center the Tkinter window on startup."""
        screen_w = self.winfo_screenwidth()
        screen_h = self.winfo_screenheight()
        pos_x = max(0, (screen_w - width) // 2)
        pos_y = max(0, (screen_h - height) // 2)
        self.geometry(f"{width}x{height}+{pos_x}+{pos_y}")

    # -----------------------------------------------------------------------
    # 1. TOP HEADER
    # -----------------------------------------------------------------------
    def _build_header(self):
        """Top masthead displaying the project title and archive metadata."""
        header_frame = tk.Frame(self, bg=BG_SECONDARY, height=52)
        header_frame.pack(side=tk.TOP, fill=tk.X)
        header_frame.pack_propagate(False)

        inner = tk.Frame(header_frame, bg=BG_SECONDARY)
        inner.pack(fill=tk.BOTH, expand=True, padx=24)

        # Left: Application Masthead
        title_box = tk.Frame(inner, bg=BG_SECONDARY)
        title_box.pack(side=tk.LEFT, fill=tk.Y)

        title_lbl = tk.Label(
            title_box,
            text="CHANNEL TAN",
            font=FONT_TITLE_MEDIUM,
            fg=TEXT_PRIMARY,
            bg=BG_SECONDARY,
        )
        title_lbl.pack(side=tk.LEFT, pady=12)

        edition_lbl = tk.Label(
            title_box,
            text="  //  PERSONAL ARCHIVE — ISSUE 01",
            font=FONT_MONO_TAG,
            fg=ACCENT_OLIVE,
            bg=BG_SECONDARY,
        )
        edition_lbl.pack(side=tk.LEFT, pady=12)

        # Right: Developer & Viva metadata badge
        right_box = tk.Frame(inner, bg=BG_SECONDARY)
        right_box.pack(side=tk.RIGHT, fill=tk.Y)

        tag_dot = tk.Label(right_box, text="●", font=FONT_MONO_TAG, fg=ACCENT_ORANGE, bg=BG_SECONDARY)
        tag_dot.pack(side=tk.LEFT, padx=(0, 6))

        viva_tag = tk.Label(
            right_box,
            text="TANMAY RAI  •  COMPUTER SCIENCE & ENGINEERING",
            font=FONT_MONO_TAG,
            fg=TEXT_SECONDARY,
            bg=BG_SECONDARY,
        )
        viva_tag.pack(side=tk.LEFT, pady=16)

        # Hairline divider under header
        divider = tk.Frame(self, bg=BORDER_COLOR, height=1)
        divider.pack(side=tk.TOP, fill=tk.X)

    # -----------------------------------------------------------------------
    # 2. FIXED BOTTOM DECK: BLONDE RADIO & MINIMAL FOOTER
    # -----------------------------------------------------------------------
    def _build_bottom_deck(self):
        """Constructs the persistent BLONDE RADIO player panel and minimal footer."""
        deck_container = tk.Frame(self, bg=BG_SECONDARY)
        deck_container.pack(side=tk.BOTTOM, fill=tk.X)

        # Top border rule for bottom panel
        border_top = tk.Frame(deck_container, bg=BORDER_COLOR, height=1)
        border_top.pack(side=tk.TOP, fill=tk.X)

        # ---------------- BLONDE RADIO PLAYER ----------------
        player_frame = tk.Frame(deck_container, bg=BG_SECONDARY, height=66)
        player_frame.pack(side=tk.TOP, fill=tk.X)
        player_frame.pack_propagate(False)

        player_inner = tk.Frame(player_frame, bg=BG_SECONDARY)
        player_inner.pack(fill=tk.BOTH, expand=True, padx=24, pady=8)

        # Left: Artwork Placeholder & Current Track Metadata
        track_box = tk.Frame(player_inner, bg=BG_SECONDARY)
        track_box.pack(side=tk.LEFT, fill=tk.Y)

        # Procedural mini record sleeve art canvas (46x46)
        self.art_canvas = tk.Canvas(
            track_box,
            width=46,
            height=46,
            bg="#181816",
            highlightthickness=1,
            highlightbackground=BORDER_COLOR,
            bd=0,
        )
        self.art_canvas.pack(side=tk.LEFT, padx=(0, 12))
        self._render_mini_artwork(self.art_canvas)

        # Text labels for track & artist
        meta_sub_box = tk.Frame(track_box, bg=BG_SECONDARY)
        meta_sub_box.pack(side=tk.LEFT, fill=tk.Y)

        radio_badge = tk.Frame(meta_sub_box, bg=BG_SECONDARY)
        radio_badge.pack(anchor="w")

        dot_lbl = tk.Label(radio_badge, text="■", font=("Menlo", 7), fg=ACCENT_ORANGE, bg=BG_SECONDARY)
        dot_lbl.pack(side=tk.LEFT, padx=(0, 4))

        badge_lbl = tk.Label(
            radio_badge,
            text="BLONDE RADIO // CURATED DECK",
            font=FONT_MONO_TAG,
            fg=ACCENT_ORANGE,
            bg=BG_SECONDARY,
        )
        badge_lbl.pack(side=tk.LEFT)

        self.lbl_track_title = tk.Label(
            meta_sub_box,
            text=self.current_track["title"],
            font=FONT_BODY_BOLD,
            fg=TEXT_PRIMARY,
            bg=BG_SECONDARY,
        )
        self.lbl_track_title.pack(anchor="w")

        self.lbl_track_artist = tk.Label(
            meta_sub_box,
            text=f"{self.current_track['artist']}  (SoundCloud Streaming)",
            font=FONT_BODY_MUTED,
            fg=TEXT_SECONDARY,
            bg=BG_SECONDARY,
        )
        self.lbl_track_artist.pack(anchor="w")

        # Center: Playback Controls & Progress Bar
        center_box = tk.Frame(player_inner, bg=BG_SECONDARY)
        center_box.pack(side=tk.LEFT, expand=True)

        # Transport Buttons (Previous, Play/Pause, Next)
        transport_box = tk.Frame(center_box, bg=BG_SECONDARY)
        transport_box.pack(pady=(0, 4))

        self.btn_prev = tk.Button(
            transport_box,
            text="⏮",
            font=("Menlo", 11),
            fg=TEXT_SECONDARY,
            bg=BG_SECONDARY,
            activeforeground=TEXT_PRIMARY,
            activebackground=BG_SURFACE,
            bd=0,
            relief=tk.FLAT,
            cursor="hand2",
            padx=8,
            pady=0,
            command=self._on_prev_track,
        )
        self.btn_prev.pack(side=tk.LEFT, padx=4)

        self.btn_play = tk.Button(
            transport_box,
            text="▶",
            font=("Menlo", 12, "bold"),
            fg=TEXT_PRIMARY,
            bg=BG_SURFACE,
            activeforeground=ACCENT_ORANGE,
            activebackground="#3D3D35",
            bd=0,
            relief=tk.FLAT,
            cursor="hand2",
            padx=12,
            pady=2,
            command=self._on_play_toggle,
        )
        self.btn_play.pack(side=tk.LEFT, padx=6)

        self.btn_next = tk.Button(
            transport_box,
            text="⏭",
            font=("Menlo", 11),
            fg=TEXT_SECONDARY,
            bg=BG_SECONDARY,
            activeforeground=TEXT_PRIMARY,
            activebackground=BG_SURFACE,
            bd=0,
            relief=tk.FLAT,
            cursor="hand2",
            padx=8,
            pady=0,
            command=self._on_next_track,
        )
        self.btn_next.pack(side=tk.LEFT, padx=4)

        # Progress timeline bar
        progress_box = tk.Frame(center_box, bg=BG_SECONDARY)
        progress_box.pack()

        self.lbl_elapsed = tk.Label(
            progress_box,
            text=self.current_track["progress"],
            font=FONT_MONO_PLAYER,
            fg=TEXT_MUTED,
            bg=BG_SECONDARY,
        )
        self.lbl_elapsed.pack(side=tk.LEFT, padx=(0, 8))

        # Canvas progress bar for clean styling
        self.bar_width = 240
        self.bar_height = 4
        self.progress_canvas = tk.Canvas(
            progress_box,
            width=self.bar_width,
            height=self.bar_height,
            bg=BORDER_COLOR,
            highlightthickness=0,
            bd=0,
        )
        self.progress_canvas.pack(side=tk.LEFT)
        self._update_progress_bar(0.0)

        self.lbl_duration = tk.Label(
            progress_box,
            text=self.current_track["duration"],
            font=FONT_MONO_PLAYER,
            fg=TEXT_MUTED,
            bg=BG_SECONDARY,
        )
        self.lbl_duration.pack(side=tk.LEFT, padx=(8, 0))

        # Right: Integration Hook / Status Notice
        right_box = tk.Frame(player_inner, bg=BG_SECONDARY)
        right_box.pack(side=tk.RIGHT, fill=tk.Y)

        self.lbl_audio_status = tk.Label(
            right_box,
            text="[ DECK: CONNECTING SOUNDCLOUD... ]",
            font=FONT_MONO_TAG,
            fg=ACCENT_OLIVE,
            bg=BG_SECONDARY,
        )
        self.lbl_audio_status.pack(anchor="e", pady=(6, 2))

        btn_hook_info = tk.Button(
            right_box,
            text="SERVICE LINK HOOK ↗",
            font=FONT_MONO_TAG,
            fg=TEXT_SECONDARY,
            bg=BG_SECONDARY,
            activeforeground=ACCENT_ORANGE,
            activebackground=BG_SECONDARY,
            bd=0,
            relief=tk.FLAT,
            cursor="hand2",
            command=self._show_player_integration_info,
        )
        btn_hook_info.pack(anchor="e")

        # ---------------- MINIMAL FOOTER ----------------
        footer_frame = tk.Frame(deck_container, bg=BG_MAIN, height=24)
        footer_frame.pack(side=tk.BOTTOM, fill=tk.X)
        footer_frame.pack_propagate(False)

        footer_line = tk.Frame(footer_frame, bg=BORDER_COLOR, height=1)
        footer_line.pack(side=tk.TOP, fill=tk.X)

        footer_content = tk.Frame(footer_frame, bg=BG_MAIN)
        footer_content.pack(fill=tk.BOTH, expand=True, padx=24)

        footer_left = tk.Label(
            footer_content,
            text="© 2026 TANMAY RAI — ALL RIGHTS RESERVED  //  COLLEGE PORTFOLIO DESKTOP OS",
            font=("Menlo", 8),
            fg=TEXT_MUTED,
            bg=BG_MAIN,
        )
        footer_left.pack(side=tk.LEFT, pady=3)

        footer_right = tk.Label(
            footer_content,
            text="TKINTER NATIVE 8.6  •  ZERO EXTERNAL FRAMEWORK DEPS",
            font=("Menlo", 8),
            fg=TEXT_MUTED,
            bg=BG_MAIN,
        )
        footer_right.pack(side=tk.RIGHT, pady=3)

    def _render_mini_artwork(self, canvas):
        """Draws a procedural miniature record sleeve on the Blonde Radio canvas."""
        canvas.delete("all")
        # Mini vinyl circle
        canvas.create_oval(3, 3, 43, 43, fill="#121210", outline="#252520")
        # Mini label
        canvas.create_oval(15, 15, 31, 31, fill=ACCENT_ORANGE, outline="")
        canvas.create_oval(21, 21, 25, 25, fill="#121210", outline="")
        # Analogue color bar accent
        canvas.create_rectangle(3, 3, 6, 43, fill=ACCENT_PINK, outline="")

    def _update_progress_bar(self, percentage):
        """Draws the filled portion of the playback progress bar."""
        self.progress_canvas.delete("all")
        # Background track
        self.progress_canvas.create_rectangle(0, 0, self.bar_width, self.bar_height, fill=BORDER_COLOR, outline="")
        # Filled active track
        fill_width = int(self.bar_width * max(0.0, min(1.0, percentage)))
        if fill_width > 0:
            self.progress_canvas.create_rectangle(0, 0, fill_width, self.bar_height, fill=ACCENT_ORANGE, outline="")

    def _on_sc_event_threadsafe(self, data):
        """Dispatches audio engine events safely to the Tkinter UI thread."""
        try:
            self.after(0, lambda d=data: self._handle_sc_event(d))
        except Exception:
            pass

    def _handle_sc_event(self, data):
        """Processes telemetry received from the background SoundCloud engine."""
        event = data.get("event")

        if event == "READY":
            duration_ms = data.get("duration")
            if duration_ms:
                mins = int(duration_ms // 60000)
                secs = int((duration_ms % 60000) // 1000)
                dur_str = f"{mins:02d}:{secs:02d}"
                self.current_track["duration"] = dur_str
                self.lbl_duration.config(text=dur_str)
            self.lbl_audio_status.config(text="[ DECK: SOUNDCLOUD READY ]", fg=ACCENT_OLIVE)

        elif event == "PLAY":
            self.is_playing = True
            self.btn_play.config(text="⏸", fg=ACCENT_ORANGE)
            self.lbl_audio_status.config(text="[ DECK: STREAMING SOUNDCLOUD ]", fg=ACCENT_PINK)

        elif event == "PAUSE":
            self.is_playing = False
            self.btn_play.config(text="▶", fg=TEXT_PRIMARY)
            self.lbl_audio_status.config(text="[ DECK: PAUSED ]", fg=ACCENT_OLIVE)

        elif event == "PROGRESS":
            pos_ms = data.get("pos", 0)
            rel = data.get("rel", 0.0)
            mins = int(pos_ms // 60000)
            secs = int((pos_ms % 60000) // 1000)
            self.lbl_elapsed.config(text=f"{mins:02d}:{secs:02d}")
            self._update_progress_bar(rel)

        elif event == "FINISH":
            self.is_playing = False
            self.btn_play.config(text="▶", fg=TEXT_PRIMARY)
            self.lbl_audio_status.config(text="[ DECK: FINISHED ]", fg=ACCENT_OLIVE)
            self.lbl_elapsed.config(text="00:00")
            self._update_progress_bar(0.0)

        elif event == "ERROR":
            self.lbl_audio_status.config(text="[ DECK: OFFLINE / RETRY ]", fg=ACCENT_ORANGE)

    # Blonde Radio Event Handlers & Hooks
    def _on_play_toggle(self):
        """Toggles playback between Play, Pause, and Resume."""
        if self.is_playing:
            self.sc_bridge.send_command("PAUSE")
        else:
            self.lbl_audio_status.config(text="[ DECK: BUFFERING SOUNDCLOUD... ]", fg=ACCENT_ORANGE)
            self.sc_bridge.send_command("PLAY")

    def _on_prev_track(self):
        """Restarts playback to the beginning of the track."""
        self.sc_bridge.send_command("SEEK 0")
        self.lbl_elapsed.config(text="00:00")
        self._update_progress_bar(0.0)

    def _on_next_track(self):
        """Restarts playback to the beginning of the track."""
        self.sc_bridge.send_command("SEEK 0")
        self.lbl_elapsed.config(text="00:00")
        self._update_progress_bar(0.0)

    def _on_close(self):
        """Cleanly terminates the background audio engine before closing Tkinter."""
        if hasattr(self, "sc_bridge"):
            self.sc_bridge.shutdown()
        self.destroy()

    def _show_player_integration_info(self):
        """Provides transparency on the player's architecture and live WebKit engine."""
        messagebox.showinfo(
            "BLONDE RADIO // Live SoundCloud Integration",
            "BLONDE RADIO Live Engine Architecture:\n\n"
            "• Track: Ivy — Frank Ocean\n"
            "• Provider: Official SoundCloud Widget API (w.soundcloud.com)\n"
            "• Audio Host: Headless macOS WebKit (WKWebView) subprocess\n"
            "• IPC Protocol: Non-blocking Stdin/Stdout JSON streaming\n"
            "• Integrity: Audio streams through speakers without launching external\n"
            "  browser windows or Spotify, and remains uninterrupted across all\n"
            "  portfolio section transitions.\n\n"
            "College Viva Tip: Highlights decoupling of Tkinter's single-threaded UI\n"
            "from modern WebAudio playback pipelines."
        )

    # -----------------------------------------------------------------------
    # 3. BODY CONTAINER (SIDEBAR + DYNAMIC CONTENT AREA)
    # -----------------------------------------------------------------------
    def _build_body(self):
        """Constructs the middle body split: vertical sidebar on left, content on right."""
        body_container = tk.Frame(self, bg=BG_MAIN)
        body_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        # ---------------- VERTICAL SIDEBAR ----------------
        self.sidebar_frame = tk.Frame(body_container, bg=BG_SECONDARY, width=SIDEBAR_WIDTH)
        self.sidebar_frame.pack(side=tk.LEFT, fill=tk.Y)
        self.sidebar_frame.pack_propagate(False)

        # Sidebar Title
        nav_header = tk.Frame(self.sidebar_frame, bg=BG_SECONDARY)
        nav_header.pack(fill=tk.X, padx=20, pady=(24, 14))

        nav_title = tk.Label(
            nav_header,
            text="INDEX // SECTIONS",
            font=FONT_MONO_BOLD,
            fg=ACCENT_OLIVE,
            bg=BG_SECONDARY,
        )
        nav_title.pack(anchor="w")

        nav_rule = tk.Frame(self.sidebar_frame, bg=BORDER_COLOR, height=1)
        nav_rule.pack(fill=tk.X, padx=20, pady=(0, 14))

        # 6 Navigation Buttons
        self.nav_list_container = tk.Frame(self.sidebar_frame, bg=BG_SECONDARY)
        self.nav_list_container.pack(fill=tk.X)

        for sec in SECTIONS:
            self._create_nav_button(sec)

        # Sidebar Bottom Details
        sidebar_bottom = tk.Frame(self.sidebar_frame, bg=BG_SECONDARY)
        sidebar_bottom.pack(side=tk.BOTTOM, fill=tk.X, padx=20, pady=20)

        side_rule = tk.Frame(sidebar_bottom, bg=BORDER_COLOR, height=1)
        side_rule.pack(fill=tk.X, pady=(0, 12))

        sys_lbl = tk.Label(
            sidebar_bottom,
            text="PORTFOLIO CORE\nSTATUS: ONLINE\nMILESTONE: 01 ACTIVE",
            font=("Menlo", 8),
            fg=TEXT_MUTED,
            bg=BG_SECONDARY,
            justify="left",
        )
        sys_lbl.pack(anchor="w")

        # Vertical Divider between sidebar and content
        v_divider = tk.Frame(body_container, bg=BORDER_COLOR, width=1)
        v_divider.pack(side=tk.LEFT, fill=tk.Y)

        # ---------------- CENTRAL CONTENT AREA ----------------
        self.content_area = tk.Frame(body_container, bg=BG_MAIN)
        self.content_area.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

    def _create_nav_button(self, section_name):
        """Creates a stylized sidebar navigation item with an active accent indicator."""
        item_frame = tk.Frame(self.nav_list_container, bg=BG_SECONDARY, cursor="hand2")
        item_frame.pack(fill=tk.X, pady=2)

        # Left active-strip indicator (3px wide)
        indicator = tk.Frame(item_frame, bg=BG_SECONDARY, width=3)
        indicator.pack(side=tk.LEFT, fill=tk.Y)

        # Text label
        label = tk.Label(
            item_frame,
            text=section_name,
            font=FONT_NAV_INACTIVE,
            fg=TEXT_SECONDARY,
            bg=BG_SECONDARY,
            padx=16,
            pady=10,
            anchor="w",
        )
        label.pack(side=tk.LEFT, fill=tk.X, expand=True)

        # Bind click events to frame and label
        item_frame.bind("<Button-1>", lambda e, s=section_name: self.navigate_to(s))
        label.bind("<Button-1>", lambda e, s=section_name: self.navigate_to(s))

        # Store references for state switching
        self.nav_widgets[section_name] = {
            "frame": item_frame,
            "indicator": indicator,
            "label": label,
        }

    # -----------------------------------------------------------------------
    # 4. NAVIGATION ROUTER
    # -----------------------------------------------------------------------
    def navigate_to(self, section_name):
        """
        Swaps the active view in the central content frame without opening new windows.
        Updates sidebar highlights.
        """
        if self.current_section == section_name:
            return

        # 1. Unpack existing page if present
        if self.current_section and self.current_section in self.pages:
            self.pages[self.current_section].pack_forget()

        # 2. Instantiate or retrieve cached page
        if section_name not in self.pages:
            if section_name == "01 / HOME":
                page = HomePage(self.content_area, navigate_callback=self.navigate_to)
            else:
                page = PlaceholderPage(self.content_area, section_name=section_name)
            self.pages[section_name] = page

        # 3. Pack the target page into the central container
        self.pages[section_name].pack(fill=tk.BOTH, expand=True)
        self.current_section = section_name

        # 4. Update sidebar styling (active vs inactive state)
        self._update_sidebar_state()

    def _update_sidebar_state(self):
        """Refreshes sidebar buttons so the active section is highlighted."""
        for sec_name, widgets in self.nav_widgets.items():
            if sec_name == self.current_section:
                widgets["frame"].configure(bg=BG_SURFACE)
                widgets["indicator"].configure(bg=ACCENT_ORANGE)
                widgets["label"].configure(
                    bg=BG_SURFACE,
                    fg=TEXT_PRIMARY,
                    font=FONT_NAV,
                )
            else:
                widgets["frame"].configure(bg=BG_SECONDARY)
                widgets["indicator"].configure(bg=BG_SECONDARY)
                widgets["label"].configure(
                    bg=BG_SECONDARY,
                    fg=TEXT_SECONDARY,
                    font=FONT_NAV_INACTIVE,
                )


def main():
    """Application launcher."""
    app = ChannelTanApp()
    app.mainloop()


if __name__ == "__main__":
    main()
