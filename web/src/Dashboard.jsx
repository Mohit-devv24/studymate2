import { useEffect, useState } from "react";
import "./Dashboard.css";
import SidebarNav from "./SidebarNav";
import { apiFetch } from "./api";

function Dashboard() {

  const userId = localStorage.getItem("userId");

  const userName = localStorage.getItem("userName");

  const [subject, setSubject] = useState("");

  const [subjects, setSubjects] = useState([]);

  const [task, setTask] = useState("");

  const [tasks, setTasks] = useState([]);

  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [minutes, setMinutes] = useState(25);

  const [seconds, setSeconds] = useState(0);

  const [timerRunning, setTimerRunning] = useState(false);

  const [isFocusMode, setIsFocusMode] = useState(false);

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

  const [selectedWallpaper, setSelectedWallpaper] = useState(() =>

    localStorage.getItem("studyTimerWallpaper") || "purple"

  );

  const [customWallpaper, setCustomWallpaper] = useState(() =>

    localStorage.getItem("studyTimerCustomWallpaper") || ""

  );

  const loadSubjects = async () => {

    try {

      const response = await apiFetch(

        `/api/subjects?user_id=${userId}`

      );

      const data = await response.json();

      setSubjects(data);

    } catch (error) {

      console.error(error);

      setMessage("Subjects load nahi ho rahe");

    }

  };

  const loadTasks = async () => {

    try {

      const response = await apiFetch(

        `/api/tasks?user_id=${userId}`

      );

      const data = await response.json();

      setTasks(data);

    } catch (error) {

      console.error(error);

      setMessage("Tasks load nahi ho rahe");

    }

  };

  useEffect(() => {

    loadSubjects();

    loadTasks();

  }, []);

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

            setIsFocusMode(false);

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

    setIsFocusMode(false);

  };

  const handleResetTimer = async () => {

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

  const handleAddSubject = async () => {

    if (!subject.trim()) {

      setMessage("Please enter a subject name");

      return;

    }

    try {

      const response = await apiFetch(

        "/api/subjects",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

          },

          body: JSON.stringify({

            name: subject,

            user_id: Number(userId),

          }),

        }

      );

      const data = await response.json();

      if (!response.ok) {

        setMessage(data.detail || "Failed to add subject");

        return;

      }

      setMessage(data.message);

      setSubject("");

      loadSubjects();

    } catch (error) {

      console.error(error);

      setMessage("Backend se connection nahi ho raha");

    }

  };

  const handleEditSubject = (item) => {

    setSubject(item.name);

    setEditingId(item.id);

    setMessage("");

  };

  const handleUpdateSubject = async () => {

    if (!subject.trim()) {

      setMessage("Please enter a subject name");

      return;

    }

    try {

      const response = await apiFetch(

        `/api/subjects/${editingId}`,

        {

          method: "PUT",

          headers: {

            "Content-Type": "application/json",

          },

          body: JSON.stringify({

            name: subject,

            user_id: Number(userId),

          }),

        }

      );

      const data = await response.json();

      setMessage(data.message);

      setSubject("");

      setEditingId(null);

      loadSubjects();

    } catch (error) {

      console.error(error);

      setMessage("Subject update nahi ho raha");

    }

  };

  const handleCancelEdit = () => {

    setSubject("");

    setEditingId(null);

    setMessage("");

  };

  const handleDeleteSubject = async (id) => {

    try {

      const response = await apiFetch(

        `/api/subjects/${id}?user_id=${userId}`,

        {

          method: "DELETE",

        }

      );

      const data = await response.json();

      setMessage(data.message);

      loadSubjects();

    } catch (error) {

      console.error(error);

      setMessage("Subject delete nahi ho raha");

    }

  };

  const handleAddTask = async () => {

    if (!task.trim()) {

      setMessage("Please enter a task");

      return;

    }

    try {

      const response = await apiFetch(

        "/api/tasks",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

          },

          body: JSON.stringify({

            title: task,

            user_id: Number(userId),

          }),

        }

      );

      const data = await response.json();

      if (!response.ok) {

        setMessage(data.detail || "Failed to add task");

        return;

      }

      setMessage(data.message);

      setTask("");

      loadTasks();

    } catch (error) {

      console.error(error);

      setMessage("Task add nahi ho raha");

    }

  };

  const handleCompleteTask = async (id) => {

    try {

      const response = await apiFetch(

        `/api/tasks/${id}/complete?user_id=${userId}`,

        {

          method: "PUT",

        }

      );

      const data = await response.json();

      setMessage(data.message);

      loadTasks();

    } catch (error) {

      console.error(error);

      setMessage("Task update nahi ho raha");

    }

  };

  const handleDeleteTask = async (id) => {

    try {

      const response = await apiFetch(

        `/api/tasks/${id}?user_id=${userId}`,

        {

          method: "DELETE",

        }

      );

      const data = await response.json();

      setMessage(data.message);

      loadTasks();

    } catch (error) {

      console.error(error);

      setMessage("Task delete nahi ho raha");

    }

  };

  const completedTasks = tasks.filter(

    (item) => item.completed

  ).length;

  const progress =

    tasks.length > 0

      ? Math.round((completedTasks / tasks.length) * 100)

      : 0;

  return (

    <div className="dashboard">

      {/* SHARED SIDEBAR */}

      <SidebarNav />

      {/* MAIN */}

      <main className="dashboard-main">

        {/* HEADER */}

        <header className="dashboard-header">

          <div>

            <p className="dashboard-eyebrow">

              STUDENT DASHBOARD

            </p>

            <h1>

              Welcome back,{" "}

              <em>{userName || "Student"}</em>

            </h1>

            <p className="dashboard-subtitle">

              Keep your study space clear. Take the next step.

            </p>

          </div>

          <div className="dashboard-date dashboard-progress">

            <div className="progress-heading">

              <span>YOUR PROGRESS</span>

              <i aria-hidden="true"></i>

            </div>

            <strong className="progress-percent">

              {progress}<small>%</small>

            </strong>

            <div className="progress-track" aria-label={`Study progress ${progress}%`}>

              <span

                className="progress-fill"

                style={{ width: `${progress}%` }}

              ></span>

            </div>

            <p className="progress-caption">

              {tasks.length === 0

                ? "Add a task to start your progress."

                : progress === 100

                  ? "Everything is complete."

                  : `${tasks.length - completedTasks} task${tasks.length - completedTasks === 1 ? "" : "s"} left to finish.`}

            </p>

          </div>

        </header>

        {/* QUICK OVERVIEW */}

        <section className="overview-grid">

          <div className="overview-card">

            <span className="overview-number">

              {subjects.length}

            </span>

            <div>

              <strong>Subjects</strong>

              <p>In your study space</p>

            </div>

            <span className="overview-arrow">↗</span>

          </div>

          <div className="overview-card">

            <span className="overview-number">

              {tasks.length}

            </span>

            <div>

              <strong>Tasks</strong>

              <p>Across your study list</p>

            </div>

            <span className="overview-arrow">↗</span>

          </div>

          <div className="overview-card overview-card-accent">

            <span className="overview-number">

              {completedTasks}

            </span>

            <div>

              <strong>Completed</strong>

              <p>Tasks you've finished</p>

            </div>

            <span className="overview-arrow">✓</span>

          </div>

        </section>

        {/* MAIN CONTENT */}

        <section className="dashboard-content-grid">

          {/* SUBJECTS */}

          <article className="dashboard-panel">

            <div className="panel-heading">

              <div>

                <p className="panel-kicker">01 / ORGANIZE</p>

                <h2>My Subjects</h2>

                <p>Keep your subjects together in one place.</p>

              </div>

              <span className="panel-count">

                {subjects.length}

              </span>

            </div>

            <div className="dashboard-add-row">

              <input

                type="text"

                placeholder="Enter subject name..."

                value={subject}

                onChange={(e) => setSubject(e.target.value)}

              />

              {editingId ? (

                <>

                  <button

                    className="dashboard-button primary"

                    onClick={handleUpdateSubject}

                  >

                    Update

                  </button>

                  <button

                    className="dashboard-button ghost"

                    onClick={handleCancelEdit}

                  >

                    Cancel

                  </button>

                </>

              ) : (

                <button

                  className="dashboard-button primary"

                  onClick={handleAddSubject}

                >

                  \+ Add

                </button>

              )}

            </div>

            <div className="dashboard-list">

              {subjects.length === 0 ? (

                <div className="dashboard-empty">

                  <span>01</span>

                  <div>

                    <strong>No subjects yet.</strong>

                    <p>Add your first subject to begin.</p>

                  </div>

                </div>

              ) : (

                subjects.map((item, index) => (

                  <div

                    className="dashboard-list-item"

                    key={item.id}

                  >

                    <div className="list-leading">

                      <span>

                        {String(index + 1).padStart(2, "0")}

                      </span>

                      <div>

                        <strong>{item.name}</strong>

                        <small>Study subject</small>

                      </div>

                    </div>

                    <div className="list-actions">

                      <button

                        onClick={() =>

                          handleEditSubject(item)

                        }

                        aria-label={`Edit ${item.name}`}

                      >

                        Edit

                      </button>

                      <button

                        className="danger"

                        onClick={() =>

                          handleDeleteSubject(item.id)

                        }

                        aria-label={`Delete ${item.name}`}

                      >

                        Delete

                      </button>

                    </div>

                  </div>

                ))

              )}

            </div>

          </article>

          {/* TASKS */}

          <article className="dashboard-panel">

            <div className="panel-heading">

              <div>

                <p className="panel-kicker">02 / ACTION</p>

                <h2>Today's Tasks</h2>

                <p>Know what needs your attention next.</p>

              </div>

              <span className="panel-count">

                {tasks.length}

              </span>

            </div>

            <div className="dashboard-add-row">

              <input

                type="text"

                placeholder="What do you need to do?"

                value={task}

                onChange={(e) => setTask(e.target.value)}

              />

              <button

                className="dashboard-button primary"

                onClick={handleAddTask}

              >

                \+ Add

              </button>

            </div>

            <div className="dashboard-list">

              {tasks.length === 0 ? (

                <div className="dashboard-empty">

                  <span>02</span>

                  <div>

                    <strong>No tasks yet.</strong>

                    <p>Add something you want to finish.</p>

                  </div>

                </div>

              ) : (

                tasks.map((item, index) => (

                  <div

                    className="dashboard-list-item"

                    key={item.id}

                  >

                    <div className="list-leading task-leading">

                      <button

                        className={`task-check ${

                          item.completed ? "checked" : ""

                        }`}

                        onClick={() =>

                          handleCompleteTask(item.id)

                        }

                        aria-label={

                          item.completed

                            ? "Mark task incomplete"

                            : "Complete task"

                        }

                      >

                        {item.completed ? "✓" : ""}

                      </button>

                      <div>

                        <strong

                          className={

                            item.completed

                              ? "task-completed"

                              : ""

                          }

                        >

                          {item.title}

                        </strong>

                        <small>

                          {item.completed

                            ? "Completed"

                            : "Pending"}

                        </small>

                      </div>

                    </div>

                    <div className="list-actions">

                      <button

                        className="danger"

                        onClick={() =>

                          handleDeleteTask(item.id)

                        }

                      >

                        Delete

                      </button>

                    </div>

                  </div>

                ))

              )}

            </div>

          </article>

        </section>

        {/* BOTTOM */}

        <section className="dashboard-bottom-grid">

          {/* PROGRESS */}

          <article className="dashboard-panel progress-panel">

            <div className="panel-heading">

              <div>

                <p className="panel-kicker">03 / PROGRESS</p>

                <h2>Keep moving.</h2>

                <p>Your task completion, based on your actual tasks.</p>

              </div>

            </div>

            <div className="progress-layout">

              <div

                className="progress-ring"

                style={{

                  "--progress": `${progress * 3.6}deg`,

                }}

              >

                <div>

                  <strong>{progress}%</strong>

                  <span>complete</span>

                </div>

              </div>

              <div className="progress-copy">

                <div className="progress-stat">

                  <strong>

                    {completedTasks}

                  </strong>

                  <span>

                    completed

                  </span>

                </div>

                <div className="progress-stat">

                  <strong>

                    {Math.max(tasks.length - completedTasks, 0)}

                  </strong>

                  <span>

                    remaining

                  </span>

                </div>

                <p>

                  Small progress is still progress.

                  Keep your next step simple.

                </p>

              </div>

            </div>

          </article>

          {/* TIMER */}

          <article className="dashboard-panel timer-panel">

            <div className="panel-heading">

              <div>

                <p className="panel-kicker">04 / FOCUS</p>

                <h2>

                  {timerRunning

                    ? "Focus Mode"

                    : "Make time to study."}

                </h2>

                <p>

                  {timerRunning

                    ? "Your focus session is running."

                    : "The full Study Timer experience, right here."}

                </p>

              </div>

              <span className="timer-mark">◷</span>

            </div>

            <div className="timer-display">

              {formatTime()}

            </div>

            <div className="timer-adjust-buttons dashboard-timer-adjust">

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

                \+ 1 min

              </button>

              <button

                className="timer-adjust"

                onClick={addFiveMinutes}

                disabled={timerRunning}

              >

                \+ 5 min

              </button>

            </div>

            <div className="timer-presets dashboard-timer-presets">

              <button onClick={() => setPreset(25)}>25 min</button>

              <button onClick={() => setPreset(50)}>50 min</button>

              <button onClick={() => setPreset(90)}>90 min</button>

            </div>

            <div className="timer-controls">

              <button

                className="dashboard-button primary"

                onClick={

                  timerRunning

                    ? () => setTimerRunning(false)

                    : enterFocusMode

                }

              >

                {timerRunning ? "Pause" : "Start Focus"}

              </button>

              <button

                className="dashboard-button ghost"

                onClick={handleResetTimer}

              >

                Reset

              </button>

            </div>

            <div className="dashboard-wallpaper-section">

              <div className="dashboard-wallpaper-heading">

                <strong>Focus wallpaper</strong>

                <span>

                  This is the background used in fullscreen focus mode.

                </span>

              </div>

              <div className="dashboard-wallpaper-grid">

                {wallpapers.map((wallpaper) => (

                  <button

                    key={wallpaper.id}

                    className={`dashboard-wallpaper-option ${

                      selectedWallpaper === wallpaper.id

                        ? "selected"

                        : ""

                    }`}

                    style={{ background: wallpaper.background }}

                    onClick={() =>

                      handleWallpaperChange(wallpaper.id)

                    }

                    disabled={timerRunning}

                  >

                    <span>{wallpaper.name}</span>

                    {selectedWallpaper === wallpaper.id && (

                      <b>✓</b>

                    )}

                  </button>

                ))}

                {customWallpaper && (

                  <button

                    className={`dashboard-wallpaper-option custom ${

                      selectedWallpaper === "custom"

                        ? "selected"

                        : ""

                    }`}

                    style={{

                      backgroundImage:

                        `url("${customWallpaper}")`,

                    }}

                    onClick={() =>

                      handleWallpaperChange("custom")

                    }

                    disabled={timerRunning}

                  >

                    <span>My Wallpaper</span>

                    {selectedWallpaper === "custom" && (

                      <b>✓</b>

                    )}

                  </button>

                )}

                <label className="dashboard-wallpaper-upload">

                  <input

                    type="file"

                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"

                    onChange={handleCustomWallpaper}

                    disabled={timerRunning}

                  />

                  <span>+</span>

                  <strong>Add Image</strong>

                  <small>JPG / PNG / WEBP</small>

                </label>

              </div>

            </div>

          </article>

        </section>

        {message && (

          <div className="dashboard-message">

            <span>•</span>

            {message}

          </div>

        )}

      </main>

      {isFocusMode && (

        <div

          className="dashboard-focus-overlay"

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

          <div className="dashboard-focus-content">

            <div className="dashboard-focus-label">

              STUDYMATE FOCUS

            </div>

            <div className="dashboard-focus-timer">

              {formatTime()}

            </div>

            <div className="dashboard-focus-controls">

              <button

                className="dashboard-focus-pause"

                onClick={() =>

                  setTimerRunning(!timerRunning)

                }

              >

                {timerRunning ? "Pause" : "Resume"}

              </button>

              <button

                className="dashboard-focus-exit"

                onClick={exitFocusMode}

              >

                Exit Focus

              </button>

            </div>

            <p>

              Press Escape to leave focus mode.

            </p>

          </div>

        </div>

      )}

    </div>

  );

}

export default Dashboard;
