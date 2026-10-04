import { useMemo, useState } from "react";
import SidebarNav from "./SidebarNav";
import "./FeatureSuite.css";

const STORAGE_KEY = "studyMateCalendar";

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function loadEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function Calendar() {
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [events, setEvents] = useState(loadEvents);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(formatDate(today));
  const [time, setTime] = useState("18:00");
  const [message, setMessage] = useState("");

  const saveEvents = (nextEvents) => {
    setEvents(nextEvents);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEvents));
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );

    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();

    const previousMonthDays = (firstDay.getDay() + 6) % 7;

    const days = [];

    for (let i = 0; i < 42; i++) {
      const dayNumber = i - previousMonthDays + 1;

      const day = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        dayNumber
      );

      days.push({
        date: day,
        key: formatDate(day),
        muted: day.getMonth() !== currentMonth.getMonth(),
      });
    }

    return days;
  }, [currentMonth]);

  const addEvent = () => {
    if (!title.trim()) {
      setMessage("Enter an event title.");
      return;
    }

    const newEvent = {
      id: Date.now(),
      title: title.trim(),
      date,
      time,
    };

    saveEvents([...events, newEvent]);

    setTitle("");
    setMessage("Event added.");
  };

  const deleteEvent = (id) => {
    saveEvents(events.filter((event) => event.id !== id));
  };

  const monthName = currentMonth.toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const monthPrefix =
    `${currentMonth.getFullYear()}-` +
    `${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;

  const monthEvents = events
    .filter((event) => event.date.startsWith(monthPrefix))
    .sort((a, b) => {
      return `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);
    });

  return (
    <div className="feature-app-page">
      <SidebarNav />

      <main className="feature-app-main">
        <header className="feature-app-header">
          <div>
            <p className="feature-app-eyebrow">
              STUDY ORGANIZATION
            </p>

            <h1>Calendar</h1>

            <p className="feature-app-subtitle">
              Keep deadlines, study sessions and important dates
              visible in one place.
            </p>
          </div>

          <div className="feature-app-number">02</div>
        </header>

        <section className="feature-app-card">
          <div className="calendar-toolbar">
            <button
              className="feature-app-button secondary"
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() - 1,
                    1
                  )
                )
              }
            >
              ←
            </button>

            <h2>{monthName}</h2>

            <button
              className="feature-app-button secondary"
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + 1,
                    1
                  )
                )
              }
            >
              →
            </button>
          </div>

          <div className="feature-app-calendar">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
              (day) => (
                <div className="calendar-weekday" key={day}>
                  {day}
                </div>
              )
            )}

            {calendarDays.map((item) => {
              const dayEvents = events.filter(
                (event) => event.date === item.key
              );

              const isToday =
                item.key === formatDate(today);

              return (
                <div
                  className={`calendar-day ${
                    item.muted ? "muted" : ""
                  } ${isToday ? "today" : ""}`}
                  key={item.key}
                >
                  <div className="calendar-day-number">
                    {item.date.getDate()}
                  </div>

                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      className="calendar-event"
                      key={event.id}
                    >
                      {event.time} · {event.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </section>

        <section
          className="feature-app-card"
          style={{ marginTop: 16 }}
        >
          <p className="feature-app-kicker">NEW EVENT</p>

          <h2>Add a deadline or study session</h2>

          <div className="feature-app-form">
            <input
              type="text"
              placeholder="e.g. Physics assignment"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
            />

            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
            />

            <input
              type="time"
              value={time}
              onChange={(event) =>
                setTime(event.target.value)
              }
            />

            <button
              className="feature-app-button"
              onClick={addEvent}
            >
              Add event
            </button>
          </div>
        </section>

        <section
          className="feature-app-card"
          style={{ marginTop: 16 }}
        >
          <p className="feature-app-kicker">
            THIS MONTH
          </p>

          <h2>Upcoming dates</h2>

          <div className="feature-app-list">
            {monthEvents.length === 0 ? (
              <p>No events for this month yet.</p>
            ) : (
              monthEvents.map((event) => (
                <div
                  className="feature-app-list-item"
                  key={event.id}
                >
                  <div className="feature-app-list-copy">
                    <strong>{event.title}</strong>

                    <span>
                      {event.date} · {event.time}
                    </span>
                  </div>

                  <button
                    className="feature-app-button danger"
                    onClick={() =>
                      deleteEvent(event.id)
                    }
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {message && (
          <div className="feature-app-message">
            {message}
          </div>
        )}
      </main>
    </div>
  );
}