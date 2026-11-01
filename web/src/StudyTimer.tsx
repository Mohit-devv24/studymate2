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

const PRESET_DURATIONS: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  deep: 50 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

function playNotificationChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.9);
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
  const [remainingSeconds, setRemainingSeconds] = useState(PRESET_DURATIONS.pomodoro);
  const [initialDurationSeconds, setInitialDurationSeconds] = useState(PRESET_DURATIONS.pomodoro);
  const [activeElapsedSeconds, setActiveElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isTabPaused, setIsTabPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  // Subject Selector State
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("General Focus");

  // Refs for reliable timing and locks
  const isSavingRef = useRef(false);
  const timerRunningRef = useRef(timerRunning);
  timerRunningRef.current = timerRunning;

  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const lastActiveTimestampRef = useRef<number | null>(null);

  // Wallpaper State (Default: charcoal)
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

  // Load user subjects
  useEffect(() => {
    let isMounted = true;
    async function loadSubjects() {
      try {
        const res = await apiFetch("/api/subjects");
        if (isMounted && res.ok && Array.isArray(res.data)) {
          setSubjects(res.data);
          if (res.data.length > 0 && selectedSubject === "General Focus") {
            setSelectedSubject(res.data[0].name);
          }
        }
      } catch (err) {
        console.debug("Could not fetch subjects:", err);
      }
    }
    loadSubjects();
    return () => {
      isMounted = false;
    };
  }, []);

  // Enter Fullscreen Action
  const enterFullscreen = useCallback(async () => {
    try {
      const target = fullscreenContainerRef.current || document.documentElement;
      if (target.requestFullscreen && !document.fullscreenElement) {
        await target.requestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      console.debug("Native fullscreen request denied, using robust viewport mode:", err);
      // Fallback: full-viewport CSS mode
      setIsFullscreen(true);
    }
  }, []);

  // Exit Fullscreen Action
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.debug("Fullscreen exit error:", err);
    }
    setIsFullscreen(false);
  }, []);

  // Record Completed Time Helper
  const recordCompletedTime = useCallback(async () => {
    if (isSavingRef.current) return;

    // Strict accounting: only record genuine active elapsed seconds
    const durationToSave = activeElapsedSeconds;

    // If duration < 10 seconds, discard without crediting (prevents accidental clicks / gaming)
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

      // Strict minute accounting: only credit full completed minutes via floor division
      const minutesCredit = Math.floor(durationToSave / 60);

      if (minutesCredit > 0) {
        try {
          const history = JSON.parse(localStorage.getItem(timerHistoryKey) || "[]");
          history.push({
            date: new Date().toISOString(),
            duration: minutesCredit,
            subject: selectedSubject,
          });
          localStorage.setItem(timerHistoryKey, JSON.stringify(history));
        } catch {}
      }

      if (res.ok) {
        const xp = res.data?.xp_awarded || 0;
        setStatusMessage(
          minutesCredit > 0
            ? `Logged ${minutesCredit} active focus min for ${selectedSubject} (+${xp} XP)`
            : `Logged ${durationToSave}s focus session.`
        );
      }
    } catch (e) {
      console.error("Failed to finish study focus session:", e);
    } finally {
      isSavingRef.current = false;
      setSessionId(null);
      setActiveElapsedSeconds(0);
    }
  }, [activeElapsedSeconds, sessionId, timerHistoryKey, selectedSubject]);

  // Synchronize Fullscreen Events & Escape key & Tab Visibility Detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          exitFullscreen();
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
      // Spacebar to pause/resume when not typing in an input
      if (
        e.code === "Space" &&
        e.target !== null &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        setTimerRunning((prev) => !prev);
      }
    };

    // Smart Tab Visibility Detection
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (timerRunningRef.current) {
          // Immediately pause the active timer
          setTimerRunning(false);
          setIsTabPaused(true);
          lastActiveTimestampRef.current = null;
        }
      } else if (document.visibilityState === "visible") {
        // When student returns, keep it in paused state so user can resume consciously
        // and re-trigger fullscreen on resume
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isFullscreen, exitFullscreen]);

  // Synchronize document body class for true fullscreen lock
  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add("studytimer-fullscreen-active");
    } else {
      document.body.classList.remove("studytimer-fullscreen-active");
    }
    return () => {
      document.body.classList.remove("studytimer-fullscreen-active");
    };
  }, [isFullscreen]);

  // Active Timer Countdown Interval with High-Precision Tick Timing
  useEffect(() => {
    if (!timerRunning) {
      lastActiveTimestampRef.current = null;
      return;
    }

    lastActiveTimestampRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const last = lastActiveTimestampRef.current || now;
      const deltaSecs = Math.max(1, Math.round((now - last) / 1000));
      lastActiveTimestampRef.current = now;

      setActiveElapsedSeconds((prev) => prev + deltaSecs);

      setRemainingSeconds((prev) => {
        if (prev <= deltaSecs) {
          clearInterval(interval);
          setTimerRunning(false);
          if (soundEnabled) {
            playNotificationChime();
          }
          recordCompletedTime();
          return 0;
        }
        return prev - deltaSecs;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, soundEnabled, recordCompletedTime]);

  // Start Focus Session with Direct User Fullscreen Gesture
  const handleStart = async () => {
    if (!timerRunning) {
      // 1. Enter fullscreen directly from user click gesture
      await enterFullscreen();
      setIsTabPaused(false);

      // 2. Start session on backend if needed
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
      // Manual Pause
      setTimerRunning(false);
      setIsTabPaused(false);
    }
  };

  // Resume Session after Tab Switch
  const handleResume = async () => {
    setIsTabPaused(false);
    await enterFullscreen();
    setTimerRunning(true);
  };

  // Reset Session
  const handleReset = async () => {
    if (timerRunning || activeElapsedSeconds >= 10) {
      await recordCompletedTime();
    }
    setTimerRunning(false);
    setIsTabPaused(false);
    setRemainingSeconds(initialDurationSeconds);
    setActiveElapsedSeconds(0);
    setSessionId(null);
  };

  // Switch Presets
  const setPreset = (presetMode: TimerMode) => {
    if (timerRunning && activeElapsedSeconds >= 10) {
      recordCompletedTime();
    }
    setTimerRunning(false);
    setIsTabPaused(false);
    setMode(presetMode);
    const secs = PRESET_DURATIONS[presetMode];
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

  // Progress percentage (0% to 100%)
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((initialDurationSeconds - remainingSeconds) / initialDurationSeconds) * 100))
  );

  const currentBg = getWallpaperBackground();
  const bgStyle = {
    "--timer-wallpaper": currentBg,
    background: currentBg,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
  } as React.CSSProperties;

  return (
    <div
      ref={fullscreenContainerRef}
      className={`timer-page ${isFullscreen ? "is-fullscreen timer-page-fullscreen" : "dashboard"} ${
        timerRunning ? "timer-running" : ""
      }`}
      style={bgStyle}
    >
      {/* Sidebar hidden completely in fullscreen */}
      {!isFullscreen && <SidebarNav />}

      <main
        className={`timer-main ${
          isFullscreen ? "fullscreen-mode-active timer-main-fullscreen" : "dashboard-main"
        }`}
      >
        {/* FULLSCREEN IMMERSIVE TOP HEADER */}
        {isFullscreen ? (
          <header className="timer-fullscreen-topbar">
            <div className="fullscreen-brand">
              <span className="fullscreen-brand-badge">SM</span>
              <div>
                <strong>StudyMate</strong>
                <small>FOCUS SPACE</small>
              </div>
            </div>

            <div className="fullscreen-meta">
              <span className="fullscreen-mode-tag">
                {mode === "pomodoro"
                  ? "Pomodoro Focus"
                  : mode === "deep"
                  ? "Deep Work"
                  : "Break Mode"}
              </span>
              <span className="fullscreen-subject-pill">
                📚 {selectedSubject}
              </span>
            </div>

            <div className="fullscreen-top-actions">
              <button
                type="button"
                className={`timer-top-btn ${soundEnabled ? "sound-on" : "sound-off"}`}
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "Mute notification chime" : "Enable notification chime"}
              >
                {soundEnabled ? "🔔 Chime On" : "🔕 Muted"}
              </button>
              <button
                type="button"
                className="timer-top-btn exit-btn"
                onClick={exitFullscreen}
                title="Exit Fullscreen (Esc)"
              >
                ✕ Exit Fullscreen
              </button>
            </div>
          </header>
        ) : (
          <header className="dashboard-header">
            <div>
              <p className="small-label">FOCUS &amp; FLOW</p>
              <h1>
                {timerRunning ? <em>Session Active</em> : "Study Timer"}
              </h1>
              <p className="header-subtitle">
                {timerRunning
                  ? "Distraction-free environment. Auto-pauses if you switch tabs."
                  : "Calm, focused study sessions with ambient wallpapers and auto-fullscreen."}
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

        {/* FEEDBACK STATUS NOTIFICATION */}
        {statusMessage && (
          <div className="timer-status-banner">
            <span>✓</span> {statusMessage}
            <button type="button" onClick={() => setStatusMessage("")}>×</button>
          </div>
        )}

        {/* TAB SWITCH PAUSE ALERT */}
        {isTabPaused && (
          <div className="timer-tab-pause-alert">
            <div className="tab-pause-info">
              <span className="pause-icon">⏸</span>
              <div>
                <strong>Timer Auto-Paused</strong>
                <p>You switched browser tabs. Time away was not counted toward your study goal.</p>
              </div>
            </div>
            <button
              type="button"
              className="tab-resume-btn"
              onClick={handleResume}
            >
              Resume Focus →
            </button>
          </div>
        )}

        {/* MAIN STUDY TIMER CARD / FLOATING HUD */}
        <section className={`study-timer-card ${isFullscreen ? "card-fullscreen" : ""}`}>
          {/* MODE SELECTOR PILLS */}
          <div className="timer-mode-pills">
            <button
              type="button"
              className={`mode-pill ${mode === "pomodoro" ? "active" : ""}`}
              onClick={() => setPreset("pomodoro")}
            >
              Pomodoro (25m)
            </button>
            <button
              type="button"
              className={`mode-pill ${mode === "deep" ? "active" : ""}`}
              onClick={() => setPreset("deep")}
            >
              Deep Work (50m)
            </button>
            <button
              type="button"
              className={`mode-pill ${mode === "shortBreak" ? "active" : ""}`}
              onClick={() => setPreset("shortBreak")}
            >
              Short Break (5m)
            </button>
            <button
              type="button"
              className={`mode-pill ${mode === "longBreak" ? "active" : ""}`}
              onClick={() => setPreset("longBreak")}
            >
              Long Break (15m)
            </button>
          </div>

          {/* SUBJECT TAGGER */}
          <div className="timer-subject-bar">
            <span className="subject-bar-label">Current Subject:</span>
            {subjects.length > 0 ? (
              <select
                className="timer-subject-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={timerRunning}
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.name}>
                    {sub.name}
                  </option>
                ))}
                <option value="General Focus">General Focus</option>
              </select>
            ) : (
              <span className="timer-subject-name">{selectedSubject}</span>
            )}
          </div>

          {/* CIRCULAR / LINEAR PROGRESS BAR */}
          <div className="timer-progress-track">
            <div
              className="timer-progress-fill"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {/* LARGE TIMER NUMERALS */}
          <div className="big-timer-wrapper">
            <div className="big-timer" aria-live="polite">
              {formatTime(remainingSeconds)}
            </div>

            <div className="timer-status-indicator">
              <span
                className={`status-dot ${
                  timerRunning ? "running" : isTabPaused ? "tab-paused" : "idle"
                }`}
              />
              <span className="status-text">
                {timerRunning
                  ? `Focusing on ${selectedSubject} (${Math.floor(activeElapsedSeconds / 60)}m ${activeElapsedSeconds % 60}s active)`
                  : isTabPaused
                  ? "Paused (Tab Inactive)"
                  : remainingSeconds === 0
                  ? "Session Completed!"
                  : "Paused / Ready to Focus"}
              </span>
            </div>
          </div>

          {/* TIME ADJUSTMENTS (DISABLED WHILE COUNTDOWN IS RUNNING) */}
          <div className="timer-adjust-buttons">
            <button
              type="button"
              className="timer-adjust"
              onClick={() => adjustMinutes(-5)}
              disabled={timerRunning || remainingSeconds <= 300}
              title="Subtract 5 minutes"
            >
              − 5 min
            </button>
            <button
              type="button"
              className="timer-adjust"
              onClick={() => adjustMinutes(-1)}
              disabled={timerRunning || remainingSeconds <= 60}
              title="Subtract 1 minute"
            >
              − 1 min
            </button>
            <button
              type="button"
              className="timer-adjust"
              onClick={() => adjustMinutes(1)}
              disabled={timerRunning}
              title="Add 1 minute"
            >
              + 1 min
            </button>
            <button
              type="button"
              className="timer-adjust"
              onClick={() => adjustMinutes(5)}
              disabled={timerRunning}
              title="Add 5 minutes"
            >
              + 5 min
            </button>
          </div>

          {/* PRIMARY TIMER CONTROLS */}
          <div className="timer-main-buttons">
            <button
              type="button"
              className={`timer-start ${timerRunning ? "is-running" : ""}`}
              onClick={handleStart}
            >
              {timerRunning ? "Pause Session" : isTabPaused ? "Resume Session" : "Start Focus"}
            </button>

            <button
              type="button"
              className="timer-reset"
              onClick={handleReset}
              title="Save completed time and reset timer"
            >
              Reset &amp; Save
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

            {!isFullscreen && (
              <button
                type="button"
                className={`timer-sound-btn ${soundEnabled ? "sound-on" : "sound-off"}`}
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "Mute chime" : "Enable chime"}
              >
                {soundEnabled ? "🔔 Chime On" : "🔕 Muted"}
              </button>
            )}
          </div>

          {/* AMBIENT WALLPAPER PICKER */}
          <div className="wallpaper-section">
            <div className="wallpaper-heading">
              <div>
                <h3>Ambient Wallpaper</h3>
                <p>Select a serene background to surround your study space.</p>
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
