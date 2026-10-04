import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudyTimer.css";
import SidebarNav from "./SidebarNav";

const wallpapers = [
  {
    id: "purple",
    name: "Purple Dream",
    background:
      "linear-gradient(135deg, #17132f 0%, #3d2f78 45%, #8b6cff 100%)",
  },
  {
    id: "ocean",
    name: "Deep Ocean",
    background:
      "linear-gradient(135deg, #071b2b 0%, #075985 50%, #22d3ee 100%)",
  },
  {
    id: "sunset",
    name: "Sunset",
    background:
      "linear-gradient(135deg, #32111f 0%, #9a3412 50%, #f59e0b 100%)",
  },
  {
    id: "forest",
    name: "Forest",
    background:
      "linear-gradient(135deg, #071f16 0%, #166534 50%, #4ade80 100%)",
  },
];

function StudyTimer() {
  const navigate = useNavigate();

  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const [selectedWallpaper, setSelectedWallpaper] = useState(() => {
    return localStorage.getItem("studyTimerWallpaper") || "purple";
  });

  const [customWallpaper, setCustomWallpaper] = useState(() => {
    return localStorage.getItem("studyTimerCustomWallpaper") || "";
  });

  useEffect(() => {
    if (!timerRunning) return;

    const timer = setInterval(() => {
      setSeconds((prevSeconds) => {
        if (prevSeconds > 0) {
          return prevSeconds - 1;
        }

        setMinutes((prevMinutes) => {
          if (prevMinutes <= 1) {
            setTimerRunning(false);
            return 0;
          }

          return prevMinutes - 1;
        });

        return 59;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerRunning]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFocusMode(false);
        setTimerRunning(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isFocusMode) {
        setIsFocusMode(false);
        setTimerRunning(false);

        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    const handleVisibilityChange = () => {
      if (isFocusMode && document.hidden) {
        // User switched to another browser tab/window.
        // Pause the timer until they return to StudyMate.
        setTimerRunning(false);
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
  }, [isFocusMode]);

  const formatTime = () => {
    return `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  };

  const addFiveMinutes = () => {
    if (minutes < 180) {
      setMinutes((prev) => Math.min(prev + 5, 180));
    }
  };

  const removeFiveMinutes = () => {
    if (minutes > 5) {
      setMinutes((prev) => Math.max(prev - 5, 1));
      setSeconds(0);
    }
  };

  const addOneMinute = () => {
    if (minutes < 180) {
      setMinutes((prev) => Math.min(prev + 1, 180));
    }
  };

  const removeOneMinute = () => {
    if (minutes > 1) {
      setMinutes((prev) => prev - 1);
      setSeconds(0);
    }
  };

  const setPreset = (value) => {
    setTimerRunning(false);
    setMinutes(value);
    setSeconds(0);
  };

  const resetTimer = async () => {
    setTimerRunning(false);
    setMinutes(25);
    setSeconds(0);
    setIsFocusMode(false);

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.log("Fullscreen exit error:", error);
    }
  };

  const enterFocusMode = async () => {
  setTimerRunning(true);
  setIsFocusMode(true);

  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  } catch (error) {
    console.log("Fullscreen permission denied:", error);
  }
};

const exitFocusMode = async () => {
  setTimerRunning(false);
  setIsFocusMode(false);

  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.log("Fullscreen exit error:", error);
  }
};

  const handleWallpaperChange = (id) => {
    setSelectedWallpaper(id);
    localStorage.setItem("studyTimerWallpaper", id);
  };

  const handleCustomWallpaper = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please select JPG, JPEG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result;

      setCustomWallpaper(imageData);
      setSelectedWallpaper("custom");

      localStorage.setItem(
        "studyTimerCustomWallpaper",
        imageData
      );

      localStorage.setItem(
        "studyTimerWallpaper",
        "custom"
      );
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  const getWallpaperBackground = () => {
    if (selectedWallpaper === "custom" && customWallpaper) {
      return `url("${customWallpaper}")`;
    }

    const wallpaper = wallpapers.find(
      (item) => item.id === selectedWallpaper
    );

    return wallpaper?.background || wallpapers[0].background;
  };

  const wallpaperStyle = {
    "--timer-wallpaper": getWallpaperBackground(),
  };

 return (
  <div
    className={`dashboard timer-page ${
      timerRunning ? "timer-running" : ""
    }`}
    style={wallpaperStyle}
  >
    <SidebarNav />

    <main className="dashboard-main timer-main">
      <header className="dashboard-header">
        <div>
          <p className="small-label">FOCUS SESSION</p>

          <h1>
            {timerRunning
              ? "Focus Mode"
              : "Study Timer"}
          </h1>

          <p className="header-subtitle">
            {timerRunning
              ? "Stay focused. Your study session is running."
              : "Stay focused and make your study session productive."}
          </p>
        </div>
      </header>

        <div className="study-timer-card">

          <div className="timer-title">
            <span>◷</span>
            <h2>Focus Timer</h2>
          </div>

          <div className="big-timer">
            {formatTime()}
          </div>

          <div className="timer-adjust-buttons">

            <button
              className="timer-adjust"
              onClick={removeFiveMinutes}
              disabled={timerRunning}
            >
              − 5 min
            </button>

            <button
              className="timer-adjust"
              onClick={removeOneMinute}
              disabled={timerRunning}
            >
              − 1 min
            </button>

            <button
              className="timer-adjust"
              onClick={addOneMinute}
              disabled={timerRunning}
            >
              + 1 min
            </button>

            <button
              className="timer-adjust"
              onClick={addFiveMinutes}
              disabled={timerRunning}
            >
              + 5 min
            </button>

          </div>

          <div className="timer-presets">

            <button onClick={() => setPreset(25)}>
              25 min
            </button>

            <button onClick={() => setPreset(50)}>
              50 min
            </button>

            <button onClick={() => setPreset(90)}>
              90 min
            </button>

          </div>

          <div className="timer-main-buttons">

           <button
  className="timer-start"
  onClick={
    timerRunning
      ? () => setTimerRunning(false)
      : enterFocusMode
  }
>
  {timerRunning ? "Pause" : "Start Focus"}
</button>

            <button
              className="timer-reset"
              onClick={resetTimer}
            >
              Reset
            </button>

          </div>

          {/* WALLPAPER */}

          <div className="wallpaper-section">

            <div className="wallpaper-heading">
              <div>
                <h3>Choose Wallpaper</h3>
                <p>
                  Select a background for your focus session.
                </p>
              </div>
            </div>

            <div className="wallpaper-grid">

              {wallpapers.map((wallpaper) => (
                <button
                  key={wallpaper.id}
                  className={`wallpaper-option ${
                    selectedWallpaper === wallpaper.id
                      ? "selected"
                      : ""
                  }`}
                  style={{
                    background: wallpaper.background,
                  }}
                  onClick={() =>
                    handleWallpaperChange(wallpaper.id)
                  }
                >
                  <span>{wallpaper.name}</span>

                  {selectedWallpaper === wallpaper.id && (
                    <b>✓</b>
                  )}
                </button>
              ))}

              {customWallpaper && (
                <button
                  className={`wallpaper-option custom-wallpaper ${
                    selectedWallpaper === "custom"
                      ? "selected"
                      : ""
                  }`}
                  style={{
                    backgroundImage: `url("${customWallpaper}")`,
                  }}
                  onClick={() =>
                    handleWallpaperChange("custom")
                  }
                >
                  <span>My Wallpaper</span>

                  {selectedWallpaper === "custom" && (
                    <b>✓</b>
                  )}
                </button>
              )}

              <label className="wallpaper-upload">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleCustomWallpaper}
                />

                <span className="upload-plus">+</span>
                <strong>Add Image</strong>
                <small>JPG, PNG, WEBP</small>
              </label>

            </div>

          </div>

        </div>

      </main>

      {isFocusMode && (
        <div
          className="focus-mode-overlay"
          style={{
            backgroundImage:
              selectedWallpaper === "custom" && customWallpaper
                ? `url("${customWallpaper}")`
                : undefined,
            background:
              selectedWallpaper !== "custom"
                ? getWallpaperBackground()
                : undefined,
          }}
        >
          <div className="focus-mode-content">
            <div className="focus-mode-label">
              STUDYMATE FOCUS
            </div>

            <div className="focus-mode-timer">
              {formatTime()}
            </div>

            <div className="focus-mode-controls">
              <button
                className="focus-pause-btn"
                onClick={() => setTimerRunning(!timerRunning)}
              >
                {timerRunning ? "Pause" : "Resume"}
              </button>

              <button
                className="focus-exit-btn"
                onClick={exitFocusMode}
              >
                Exit Focus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudyTimer;