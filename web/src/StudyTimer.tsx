import React, { useEffect, useState, useRef, useCallback } from "react";
import "./StudyTimer.css";
import SidebarNav from "./SidebarNav";
import SiteFooter from "./components/SiteFooter";
import { apiFetch } from "./api";

interface Wallpaper {
  id: string;
  name: string;
  background: string;
}

const wallpapers: Wallpaper[] = [
  {
    id: "charcoal",
    name: "Warm Charcoal",
    background: "linear-gradient(135deg, #151412 0%, #201E1B 50%, #2A2622 100%)",
  },
  {
    id: "obsidian",
    name: "Obsidian Amber",
    background: "linear-gradient(135deg, #0e1015 0%, #1a1714 50%, #301f14 100%)",
  },
  {
    id: "linen",
    name: "Warm Linen",
    background: "linear-gradient(135deg, #F5F2ED 0%, #E8E2D8 50%, #DDD5C7 100%)",
  },
  {
    id: "terracotta",
    name: "Terracotta Dusk",
    background: "linear-gradient(135deg, #241a15 0%, #3c2417 50%, #57331e 100%)",
  },
  {
    id: "midnight",
    name: "Deep Midnight",
    background: "linear-gradient(135deg, #090d16 0%, #121824 50%, #1d273a 100%)",
  },
  {
    id: "forest",
    name: "Forest Pine",
    background: "linear-gradient(135deg, #0f1a14 0%, #19271e 50%, #22372a 100%)",
  },
  {
    id: "cosmic",
    name: "Cosmic Void",
    background: "linear-gradient(135deg, #0a0a0f 0%, #141424 50%, #221a36 100%)",
  },
  {
    id: "sunset",
    name: "Sunset Ember",
    background: "linear-gradient(135deg, #2b1812 0%, #4a2717 50%, #70361a 100%)",
  },
];

type TimerMode = "pomodoro" | "deep" | "shortBreak" | "longBreak";

function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.85);
  } catch (e) {
    console.debug("Audio chime unavailable:", e);
  }
}

export default function StudyTimer() {
  const userId = localStorage.getItem("userId") || "guest";
  const wpKey = `studyTimerWallpaper_${userId}`;
  const customWpKey = `studyTimerCustomWallpaper_${userId}`;
  const timerHistoryKey = `studyMateTimerHistory_${userId}`;

  // Timer Core State
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [initialDurationSeconds, setInitialDurationSeconds] = useState(25 * 60);
  const [activeElapsedSeconds, setActiveElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  const isSavingRef = useRef(false);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  // Wallpaper State
  const [selectedWallpaper, setSelectedWallpaper] = useState<string>(() => {
    return localStorage.getItem(wpKey) || localStorage.getItem("studyTimerWallpaper") || "charcoal";
  });
  const [customWallpaper, setCustomWallpaper] = useState<string>(() => {
    return localStorage.getItem(customWpKey) || localStorage.getItem("studyTimerCustomWallpaper") || "";
  });

  const getWallpaperBackground = useCallback(() => {
    if (selectedWallpaper === "custom" && customWallpaper) {
      return `url("${customWallpaper}")`;
    }
    const match = wallpapers.find((w) => w.id === selectedWallpaper);
    return match ? match.background : wallpapers[0].background;
  }, [selectedWallpaper, customWallpaper]);

  // Synchronize Fullscreen Events & Escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          exitFullscreen();
        }
      }
      // Spacebar to pause/resume
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        setTimerRunning((prev) => !prev);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && timerRunning) {
        // Tab backgrounded — keep countdown consistent
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isFullscreen, timerRunning]);

  // Record Completed Time Helper
  const recordCompletedTime = useCallback(async () => {
    if (isSavingRef.current) return;

    // Strict accounting: only record actual active elapsed seconds
    const durationToSave = activeElapsedSeconds;

    // If duration < 10 seconds, do not record (accidental tap)
    if (durationToSave < 10) {
      setSessionId(null);
      setActiveElapsedSeconds(0);
      return;
    }

    isSavingRef.current = true;

    try {
      const targetSessionId = sessionId || 0;
      const res = await apiFetch(`/api/study/focus/${targetSessionId}/finish`, {
        method: "POST",
        body: JSON.stringify({ duration_seconds: durationToSave }),
      });

      // Daily study goal accounting: only credit full minutes (floor division)
      const minutesCredit = Math.floor(durationToSave / 60);

      if (minutesCredit > 0) {
        try {
          const history = JSON.parse(localStorage.getItem(timerHistoryKey) || "[]");
          history.push({
            date: new Date().toISOString(),
            duration: minutesCredit,
          });
          localStorage.setItem(timerHistoryKey, JSON.stringify(history));
        } catch {}
      }

      if (res.ok) {
        const xp = res.data?.xp_awarded || 0;
        setStatusMessage(
          minutesCredit > 0
            ? `Logged ${minutesCredit} focused minutes (+${xp} XP)`
            : `Logged ${durationToSave}s session.`
        );
      }
    } catch (e) {
      console.error("Failed to finish study focus session:", e);
    } finally {
      isSavingRef.current = false;
      setSessionId(null);
      setActiveElapsedSeconds(0);
    }
  }, [activeElapsedSeconds, sessionId, timerHistoryKey]);

  // Active Timer Countdown Effect
  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setActiveElapsedSeconds((prev) => prev + 1);

      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          if (soundEnabled) {
            playNotificationChime();
          }
          recordCompletedTime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, soundEnabled, recordCompletedTime]);

  // Enter Fullscreen Action
  const enterFullscreen = async () => {
    setIsFullscreen(true);
    try {
      const target = fullscreenContainerRef.current || document.documentElement;
      if (target.requestFullscreen && !document.fullscreenElement) {
        await target.requestFullscreen();
      }
    } catch (err) {
      console.debug("Native fullscreen request denied, using robust modal fallback:", err);
    }
  };

  // Exit Fullscreen Action
  const exitFullscreen = async () => {
    setIsFullscreen(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.debug("Fullscreen exit error:", err);
    }
  };

  // Start Focus Session
  const handleStart = async () => {
    if (!timerRunning) {
      if (!sessionId) {
        try {
          const res = await apiFetch("/api/study/focus/start", { method: "POST" });
          if (res.ok && res.data?.session_id) {
            setSessionId(res.data.session_id);
          }
        } catch {}
      }
      setTimerRunning(true);
    } else {
      setTimerRunning(false);
    }
  };

  // Reset Session
  const handleReset = async () => {
    if (timerRunning || activeElapsedSeconds >= 10) {
      await recordCompletedTime();
    }
    setTimerRunning(false);
    setRemainingSeconds(initialDurationSeconds);
    setActiveElapsedSeconds(0);
    setSessionId(null);
  };

  // Switch Presets
  const setPreset = (presetMode: TimerMode, minutes: number) => {
    if (timerRunning && activeElapsedSeconds >= 10) {
      recordCompletedTime();
    }
    setTimerRunning(false);
    setMode(presetMode);
    const secs = minutes * 60;
    setInitialDurationSeconds(secs);
    setRemainingSeconds(secs);
    setActiveElapsedSeconds(0);
    setSessionId(null);
  };

  // Time Adjusters
  const adjustMinutes = (delta: number) => {
    if (timerRunning) return;
    setRemainingSeconds((prev) => {
      const updated = Math.max(60, Math.min(180 * 60, prev + delta * 60));
      setInitialDurationSeconds(updated);
      return updated;
    });
  };

  // Wallpaper Handlers
  const handleWallpaperChange = (id: string) => {
    setSelectedWallpaper(id);
    localStorage.setItem(wpKey, id);
    localStorage.setItem("studyTimerWallpaper", id);
  };

  const handleCustomWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Please upload a JPG, PNG, or WEBP image.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCustomWallpaper(reader.result);
        setSelectedWallpaper("custom");
        localStorage.setItem(customWpKey, reader.result);
        localStorage.setItem(wpKey, "custom");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Format Time (MM:SS)
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const bgStyle = {
    "--timer-wallpaper": getWallpaperBackground(),
  } as React.CSSProperties;

  return (
    <div
      ref={fullscreenContainerRef}
      className={`dashboard timer-page ${timerRunning ? "timer-running" : ""} ${
        isFullscreen ? "is-fullscreen" : ""
      }`}
      style={bgStyle}
    >
      {!isFullscreen && <SidebarNav />}

      <main className={`dashboard-main timer-main ${isFullscreen ? "fullscreen-mode-active" : ""}`}>
        {!isFullscreen && (
          <header className="dashboard-header">
            <div>
              <p className="small-label">FOCUS & FLOW</p>
              <h1>
                {timerRunning ? <em>Session Active</em> : "Study Timer"}
              </h1>
              <p className="header-subtitle">
                {timerRunning
                  ? "Distraction-free environment. Keep the streak going."
                  : "Calm, focused pomodoro study sessions with ambient wallpapers."}
              </p>
            </div>

            <div className="timer-header-actions">
              <button
                type="button"
                className="dashboard-button ghost timer-fullscreen-trigger"
                onClick={enterFullscreen}
                title="Enter Distraction-Free Fullscreen (Esc to exit)"
              >
                <span>⛶</span> Fullscreen Mode
              </button>
            </div>
          </header>
        )}

        {statusMessage && (
          <div className="timer-status-banner">
            <span>✓</span> {statusMessage}
            <button type="button" onClick={() => setStatusMessage("")}>×</button>
          </div>
        )}

        {/* MAIN TIMER CARD */}
        <section className={`study-timer-card ${isFullscreen ? "card-fullscreen" : ""}`}>
          <div className="timer-mode-pills">
            <button
              type="button"
              className={`mode-pill ${mode === "pomodoro" ? "active" : ""}`}
              onClick={() => setPreset("pomodoro", 25)}
            >
              Pomodoro (25m)
            </button>
            <button
              type="button"
              className={`mode-pill ${mode === "deep" ? "active" : ""}`}
              onClick={() => setPreset("deep", 50)}
            >
              Deep Work (50m)
            </button>
            <button
              type="button"
              className={`mode-pill ${mode === "shortBreak" ? "active" : ""}`}
              onClick={() => setPreset("shortBreak", 5)}
            >
              Short Break (5m)
            </button>
            <button
              type="button"
              className={`mode-pill ${mode === "longBreak" ? "active" : ""}`}
              onClick={() => setPreset("longBreak", 15)}
            >
              Long Break (15m)
            </button>
          </div>

          <div className="big-timer-wrapper">
            <div className="big-timer" aria-live="polite">
              {formatTime(remainingSeconds)}
            </div>

            <div className="timer-status-indicator">
              <span className={`status-dot ${timerRunning ? "running" : "idle"}`} />
              <span className="status-text">
                {timerRunning
                  ? `Focusing (${Math.floor(activeElapsedSeconds / 60)}m ${activeElapsedSeconds % 60}s logged)`
                  : remainingSeconds === 0
                  ? "Session Completed!"
                  : "Paused / Ready"}
              </span>
            </div>
          </div>

          {/* TIME ADJUSTMENTS */}
          <div className="timer-adjust-buttons">
            <button
              type="button"
              className="timer-adjust"
              onClick={() => adjustMinutes(-5)}
              disabled={timerRunning || remainingSeconds <= 300}
            >
              − 5 min
            </button>
            <button
              type="button"
              className="timer-adjust"
              onClick={() => adjustMinutes(-1)}
              disabled={timerRunning || remainingSeconds <= 60}
            >
              − 1 min
            </button>
            <button
              type="button"
              className="timer-adjust"
              onClick={() => adjustMinutes(1)}
              disabled={timerRunning}
            >
              + 1 min
            </button>
            <button
              type="button"
              className="timer-adjust"
              onClick={() => adjustMinutes(5)}
              disabled={timerRunning}
            >
              + 5 min
            </button>
          </div>

          {/* PRIMARY CONTROLS */}
          <div className="timer-main-buttons">
            <button
              type="button"
              className={`timer-start ${timerRunning ? "is-running" : ""}`}
              onClick={handleStart}
            >
              {timerRunning ? "Pause Session" : "Start Focus"}
            </button>

            <button
              type="button"
              className="timer-reset"
              onClick={handleReset}
            >
              Reset & Save
            </button>

            {isFullscreen ? (
              <button
                type="button"
                className="timer-fullscreen-btn"
                onClick={exitFullscreen}
                title="Exit Fullscreen (Esc)"
              >
                Exit Fullscreen (Esc)
              </button>
            ) : (
              <button
                type="button"
                className="timer-fullscreen-btn"
                onClick={enterFullscreen}
                title="Enter Distraction-Free Fullscreen"
              >
                <span>⛶</span> Fullscreen
              </button>
            )}

            <button
              type="button"
              className={`timer-sound-btn ${soundEnabled ? "sound-on" : "sound-off"}`}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute notification chime" : "Enable notification chime"}
            >
              {soundEnabled ? "🔔 Chime On" : "🔕 Muted"}
            </button>
          </div>

          {/* WALLPAPER SELECTOR (VISIBLE BOTH IN STANDARD & FULLSCREEN) */}
          <div className="wallpaper-section">
            <div className="wallpaper-heading">
              <div>
                <h3>Ambient Wallpaper</h3>
                <p>Choose an inspiring study theme or upload your custom background.</p>
              </div>
            </div>

            <div className="wallpaper-grid">
              {wallpapers.map((wp) => (
                <button
                  key={wp.id}
                  type="button"
                  className={`wallpaper-option ${selectedWallpaper === wp.id ? "selected" : ""}`}
                  style={{ background: wp.background }}
                  onClick={() => handleWallpaperChange(wp.id)}
                >
                  <span>{wp.name}</span>
                  {selectedWallpaper === wp.id && <b className="check-mark">✓</b>}
                </button>
              ))}

              {customWallpaper && (
                <button
                  type="button"
                  className={`wallpaper-option custom-wallpaper ${
                    selectedWallpaper === "custom" ? "selected" : ""
                  }`}
                  style={{ backgroundImage: `url("${customWallpaper}")` }}
                  onClick={() => handleWallpaperChange("custom")}
                >
                  <span>My Wallpaper</span>
                  {selectedWallpaper === "custom" && <b className="check-mark">✓</b>}
                </button>
              )}

              <label className="wallpaper-upload" title="Upload custom JPG, PNG or WEBP background">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCustomWallpaperUpload}
                />
                <span className="upload-plus">+</span>
                <strong>Upload Image</strong>
                <small>JPG / PNG / WEBP</small>
              </label>
            </div>
          </div>
        </section>

        {!isFullscreen && <SiteFooter />}
      </main>
    </div>
  );
}
