import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Planner.css";
import SidebarNav from "./SidebarNav";


const DAYS = [
  { key: "Mon", label: "Monday" },
  { key: "Tue", label: "Tuesday" },
  { key: "Wed", label: "Wednesday" },
  { key: "Thu", label: "Thursday" },
  { key: "Fri", label: "Friday" },
  { key: "Sat", label: "Saturday" },
  { key: "Sun", label: "Sunday" },
];

function Planner() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId") || "guest";
  const userName = localStorage.getItem("userName") || "Student";
  const storageKey = `studyMatePlanner_${userId}`;

  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [day, setDay] = useState("Mon");
  const [time, setTime] = useState("18:00");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState("60");
  const [message, setMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(sessions));
  }, [sessions, storageKey]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 2400);
    return () => clearTimeout(timer);
  }, [message]);

  const orderedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const dayDiff = DAYS.findIndex((item) => item.key === a.day) -
        DAYS.findIndex((item) => item.key === b.day);
      if (dayDiff !== 0) return dayDiff;
      return a.time.localeCompare(b.time);
    });
  }, [sessions]);

  const addSession = () => {
    const cleanSubject = subject.trim();
    if (!cleanSubject) {
      setMessage("Enter a subject or study topic first.");
      return;
    }

    const newSession = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      day,
      time,
      subject: cleanSubject,
      duration: Number(duration) || 60,
      completed: false,
    };

    setSessions((current) => [...current, newSession]);
    setSubject("");
    setMessage("Study session added.");
  };

  const toggleSession = (id) => {
    setSessions((current) =>
      current.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const deleteSession = (id) => {
    setSessions((current) => current.filter((item) => item.id !== id));
    setMessage("Session removed.");
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const totalMinutes = sessions.reduce((sum, item) => sum + Number(item.duration || 0), 0);
  const completedCount = sessions.filter((item) => item.completed).length;

  return (
  <div className="planner-page">
    <SidebarNav />

    <main className="planner-main">
      <header className="planner-header">
        <div>
          <p className="planner-eyebrow">STUDY PLANNING</p>
          <h1>Plan your week.</h1>
          <p>
            Give your subjects a place in the week, then simply follow the plan.
          </p>
        </div>

        <div className="planner-header-meta">
          <strong>{sessions.length}</strong>
          <span>SESSIONS</span>
        </div>
      </header>

        <section className="planner-stats">
          <div><span>01</span><strong>{sessions.length}</strong><small>planned sessions</small></div>
          <div><span>02</span><strong>{Math.round(totalMinutes / 60 * 10) / 10}h</strong><small>planned study time</small></div>
          <div><span>03</span><strong>{completedCount}</strong><small>completed</small></div>
        </section>

        <section className="planner-editor">
          <div className="planner-editor-title">
            <p>NEW SESSION</p>
            <h2>Add a study block</h2>
            <span>Build your week one focused session at a time.</span>
          </div>

          <div className="planner-form">
            <label>
              Day
              <select value={day} onChange={(e) => setDay(e.target.value)}>
                {DAYS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
              </select>
            </label>
            <label>
              Time
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
            <label className="planner-subject-field">
              Subject / topic
              <input
                type="text"
                placeholder="e.g. Maths — Matrices"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addSession(); }}
              />
            </label>
            <label>
              Duration
              <select value={duration} onChange={(e) => setDuration(e.target.value)}>
                <option value="25">25 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
                <option value="120">120 min</option>
              </select>
            </label>
            <button className="planner-add-button" onClick={addSession}>Add session <span>↗</span></button>
          </div>
        </section>

        <section className="planner-board-section">
          <div className="planner-section-header">
            <div>
              <p>YOUR WEEK</p>
              <h2>Study plan</h2>
            </div>
            <span>{sessions.length ? "Real sessions from your planner" : "Nothing planned yet"}</span>
          </div>

          {orderedSessions.length === 0 ? (
            <div className="planner-empty">
              <div className="planner-empty-number">01</div>
              <div>
                <h3>Your week is clear.</h3>
                <p>Add your first study block above. Your plan will stay saved on this device.</p>
              </div>
            </div>
          ) : (
            <div className="planner-board">
              {DAYS.map((currentDay) => {
                const daySessions = orderedSessions.filter((item) => item.day === currentDay.key);
                return (
                  <div className="planner-day" key={currentDay.key}>
                    <div className="planner-day-head">
                      <strong>{currentDay.key}</strong>
                      <span>{currentDay.label}</span>
                    </div>
                    <div className="planner-day-body">
                      {daySessions.length === 0 ? (
                        <small className="planner-day-empty">No session</small>
                      ) : daySessions.map((item) => (
                        <article className={`planner-session ${item.completed ? "completed" : ""}`} key={item.id}>
                          <div className="planner-session-time">{item.time}</div>
                          <h3>{item.subject}</h3>
                          <p>{item.duration} min focus block</p>
                          <div className="planner-session-actions">
                            <button onClick={() => toggleSession(item.id)}>{item.completed ? "Completed" : "Mark done"}</button>
                            <button onClick={() => deleteSession(item.id)}>Delete</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="planner-note">
          <span>STUDYMATE / NOTE TO SELF</span>
          <h2>“A plan does not need to be perfect. It just needs to make the next step visible.”</h2>
        </section>

        {message && <div className="planner-message" role="status">• {message}</div>}
      </main>
    </div>
  );
}

export default Planner;
