"""
soundcloud_player.py - Headless macOS WebKit engine for BLONDE RADIO.

Architecture & College Viva Explanation:
- Standard Tkinter has no native web browser widget, JavaScript runtime,
  or HTML5 WebAudio engine.
- To play official SoundCloud streams via their official Widget API without opening
  external browser windows (Safari/Chrome/Spotify), this script runs as an isolated
  background helper process.
- It leverages macOS's native WebKit (WKWebView) via PyObjC.
- It configures media playback without user-gesture requirements
  (WKAudiovisualMediaTypeNone) so the Tkinter UI can control audio programmatically.
- It exchanges JSON event messages with Tkinter over standard pipes (stdin/stdout).
"""

import sys
import os
import json
import time
import threading

import queue

from Foundation import NSObject, NSURL, NSDate
from AppKit import (
    NSApplication,
    NSApp,
    NSWindow,
    NSBackingStoreBuffered,
    NSMakeRect,
    NSWindowStyleMaskBorderless,
)
from WebKit import (
    WKWebView,
    WKWebViewConfiguration,
    WKUserContentController,
    WKAudiovisualMediaTypeNone,
)

# Target SoundCloud track: Frank Ocean - Ivy
SOUNDCLOUD_URL = "https://soundcloud.com/kimxtn/frank-ocean-ivy-1"

HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BLONDE RADIO SOUNDCLOUD ENGINE</title>
  <script src="https://w.soundcloud.com/player/api.js"></script>
</head>
<body style="margin:0; background:#20201E;">
  <iframe id="sc-widget"
          src="https://w.soundcloud.com/player/?url={track_url}&auto_play=false&buying=false&sharing=false&download=false&show_artwork=false&show_comments=false&show_playcount=false&show_user=false"
          width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay">
  </iframe>
  <script>
    var iframe = document.getElementById('sc-widget');
    var widget = SC.Widget(iframe);
    var isReady = false;

    function notifyPython(payload) {
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.scBridge) {
        window.webkit.messageHandlers.scBridge.postMessage(JSON.stringify(payload));
      }
    }

    widget.bind(SC.Widget.Events.READY, function() {
      isReady = true;
      widget.getDuration(function(duration) {
        notifyPython({event: "READY", duration: duration});
      });
    });

    widget.bind(SC.Widget.Events.PLAY, function() {
      notifyPython({event: "PLAY"});
    });

    widget.bind(SC.Widget.Events.PAUSE, function() {
      notifyPython({event: "PAUSE"});
    });

    widget.bind(SC.Widget.Events.FINISH, function() {
      notifyPython({event: "FINISH"});
    });

    widget.bind(SC.Widget.Events.PLAY_PROGRESS, function(data) {
      notifyPython({
        event: "PROGRESS",
        pos: data.currentPosition,
        rel: data.relativePosition
      });
    });

    widget.bind(SC.Widget.Events.ERROR, function() {
      notifyPython({event: "ERROR", msg: "SoundCloud Widget API reported an error."});
    });

    // Control helper functions called via evaluateJavaScript
    function scPlay() {
      if (widget) { widget.play(); }
    }
    function scPause() {
      if (widget) { widget.pause(); }
    }
    function scSeek(positionMs) {
      if (widget) { widget.seekTo(positionMs); }
    }
  </script>
</body>
</html>
"""


class ScriptHandler(NSObject):
    """Bridge handler receiving postMessage notifications from the WebKit JavaScript context."""

    def userContentController_didReceiveScriptMessage_(self, userContentController, message):
        raw_body = message.body()
        # Emit raw JSON string to stdout for Tkinter consumption
        print(raw_body, flush=True)


class SoundCloudEngine:
    """Manages the lifecycle of the headless WebKit engine and stdin command processor."""

    def __init__(self, track_url=SOUNDCLOUD_URL):
        self.track_url = track_url
        self.app = NSApplication.sharedApplication()
        self.running = True

        # 1. Configure WebKit
        self.config = WKWebViewConfiguration.alloc().init()
        # Allow programmatic playback without requiring manual user interaction inside the webview
        self.config.setMediaTypesRequiringUserActionForPlayback_(WKAudiovisualMediaTypeNone)

        self.ucc = WKUserContentController.alloc().init()
        self.handler = ScriptHandler.alloc().init()
        self.ucc.addScriptMessageHandler_name_(self.handler, "scBridge")
        self.config.setUserContentController_(self.ucc)

        # 2. Borderless offscreen window host
        # (WebKit requires an NSWindow hierarchy to process media timing and avoid throttling)
        rect = NSMakeRect(-2000, -2000, 400, 200)
        self.webview = WKWebView.alloc().initWithFrame_configuration_(rect, self.config)

        self.window = NSWindow.alloc().initWithContentRect_styleMask_backing_defer_(
            rect,
            NSWindowStyleMaskBorderless,
            NSBackingStoreBuffered,
            False
        )
        self.window.setContentView_(self.webview)
        self.window.orderBack_(None)

        # 3. Load embed HTML
        html = HTML_TEMPLATE.replace("{track_url}", self.track_url)
        base_url = NSURL.URLWithString_("https://w.soundcloud.com")
        self.webview.loadHTMLString_baseURL_(html, base_url)

        # 4. Command Queue for thread-safe main-thread dispatching
        self.cmd_queue = queue.Queue()

        # 5. Start background listener for stdin commands from Tkinter
        self.stdin_thread = threading.Thread(target=self._listen_stdin, daemon=True)
        self.stdin_thread.start()

    def _listen_stdin(self):
        """Reads downstream commands from Tkinter over standard input and enqueues them."""
        for line in sys.stdin:
            cmd = line.strip()
            if cmd:
                self.cmd_queue.put(cmd)
                if cmd == "QUIT":
                    break

    def _eval_js(self, js_code):
        """Dispatches JavaScript execution safely to WebKit on the main thread."""
        try:
            self.webview.evaluateJavaScript_completionHandler_(js_code, None)
        except Exception as e:
            print(json.dumps({"event": "ERROR", "msg": str(e)}), flush=True)

    def run(self):
        """Runs the native AppKit / WebKit event pump until QUIT is received."""
        while self.running:
            # 1. Drain and execute commands on the main thread
            while not self.cmd_queue.empty():
                try:
                    cmd = self.cmd_queue.get_nowait()
                except queue.Empty:
                    break

                if cmd == "PLAY":
                    self._eval_js("scPlay();")
                elif cmd == "PAUSE":
                    self._eval_js("scPause();")
                elif cmd.startswith("SEEK "):
                    try:
                        pos = int(cmd.split(" ")[1])
                        self._eval_js(f"scSeek({pos});")
                    except Exception:
                        pass
                elif cmd == "QUIT":
                    self.running = False
                    return

            # 2. Pump Cocoa / WebKit events with a small timeout
            timeout_date = NSDate.dateWithTimeIntervalSinceNow_(0.02)
            event = self.app.nextEventMatchingMask_untilDate_inMode_dequeue_(
                0xFFFFFFFFFFFFFFFF,
                timeout_date,
                "kCFRunLoopDefaultMode",
                True
            )
            if event:
                self.app.sendEvent_(event)


def main():
    try:
        engine = SoundCloudEngine()
        engine.run()
    except Exception as e:
        print(json.dumps({"event": "ERROR", "msg": f"Engine failed to start: {e}"}), flush=True)


if __name__ == "__main__":
    main()
