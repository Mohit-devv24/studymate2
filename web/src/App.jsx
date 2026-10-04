import { Routes, Route, Link } from "react-router-dom";

import { useState } from "react";



import Signup from "./Signup";

import Login from "./LoginPage";

import Dashboard from "./Dashboard";

import Subjects from "./Subjects";

import Tasks from "./Tasks";

import Notes from "./Notes";

import StudyTimer from "./StudyTimer";

import Planner from "./Planner";

import Calendar from "./Calendar";

import Goals from "./Goals";

import Analytics from "./Analytics";

import Habits from "./Habits";





function Home() {

  const [activeQuote, setActiveQuote] = useState(null);



  const quoteCards = [

    {

      id: 1,

      type: "image",

      image: "https\://i.pinimg.com/736x/8c/90/20/8c9020e194ec30656619fd3dd53567ee.jpg",

      title: "Motivation poster 01",

      kicker: "01 / KEEP GOING",

    },

    {

      id: 2,

      type: "image",

      image: "https\://i.pinimg.com/736x/95/6c/c1/956cc15b33fb0c33eb12a79fb2dd3e59.jpg",

      title: "Motivation poster 02",

      kicker: "02 / STAY FOCUSED",

    },

    {

      id: 3,

      type: "image",

      image: "https\://i.pinimg.com/736x/67/e6/ca/67e6cabc7ecd72a588b56de4b0e14b06.jpg",

      title: "Motivation poster 03",

      kicker: "03 / TRUST THE WORK",

    },

    {

      id: 4,

      type: "image",

      image: "https\://i.pinimg.com/736x/e2/1c/8c/e21c8c22165a420fc8a8f9fa99cd67b8.jpg",

      title: "Motivation poster 04",

      kicker: "04 / KEEP MOVING",

    },

    {

      id: 5,

      type: "image",

      image: "https\://i.pinimg.com/736x/50/a6/8b/50a68b954771be87e4c4178413461a2a.jpg",

      title: "Motivation poster 05",

      kicker: "05 / BELIEVE",

    },

    {

      id: 6,

      type: "image",

      image: "https\://i.pinimg.com/736x/82/5a/06/825a06946207e379c208da1fcf12762a.jpg",

      title: "Motivation poster 06",

      kicker: "06 / DISCIPLINE",

    },

    {

      id: 7,

      type: "text",

      title: "Start before you feel ready.",

      body: "You do not need a perfect day. You only need a place to begin.",

      kicker: "07 / BEGIN",

    },

    {

      id: 8,

      type: "text",

      title: "Consistency beats intensity.",

      body: "A little focused work, repeated often, can take you much further than one huge session.",

      kicker: "08 / CONSISTENCY",

    },

  ];



  const features = [

    {

      number: "01",

      title: "Subjects",

      text: "Keep your subjects organized in one place so your study space stays easy to navigate.",

      mark: "S",

    },

    {

      number: "02",

      title: "Tasks",

      text: "Create and manage the work you need to finish instead of keeping everything in your head.",

      mark: "✓",

    },

    {

      number: "03",

      title: "Notes",

      text: "Write down explanations, ideas and important reminders and keep them close to your study flow.",

      mark: "N",

    },

    {

      number: "04",

      title: "Focus",

      text: "Use the built-in study timer when you want a dedicated block of uninterrupted study time.",

      mark: "◷",

    },

  ];



  return (

    <div className="home-page">

      <div className="home-background" aria-hidden="true">

        <div className="home-grid"></div>

        <div className="home-glow"></div>

        <div className="home-line home-line-one"></div>

        <div className="home-line home-line-two"></div>

      </div>



      <header className="home-nav">

        <Link to="/" className="home-brand">

          <span className="home-brand-mark">SM</span>

          <span>StudyMate</span>

        </Link>



        <nav className="home-nav-links">

          <a href="#story">Why StudyMate</a>

          <a href="#features">Features</a>

          <a href="#quotes">Motivation</a>

        </nav>



        <div className="home-nav-right">

          <span className="home-account-label">ACCOUNT</span>

          <Link to="/login" className="home-login">Login <span>↗</span></Link>

          <Link to="/signup" className="home-nav-button">Get Started <span>↗</span></Link>

        </div>

      </header>



      <main>

        <section className="home-hero">

          <div className="home-hero-left">

            <div className="home-eyebrow"><span></span>A BETTER WAY TO STUDY</div>

            <h1 className="home-title">

              <span className="home-title-line">Study</span>

              <span className="home-title-line home-title-offset"><em>without</em></span>

              <span className="home-title-line">the chaos.</span>

            </h1>

            <p className="home-description">

              StudyMate puts your subjects, tasks, notes and focused study sessions into one simple workspace.

            </p>

            <div className="home-actions">

              <Link to="/signup" className="home-primary-button"><span>Start with StudyMate</span><b>→</b></Link>

              <a href="#features" className="home-text-button">See what you can do <span>↓</span></a>

            </div>

          </div>



          <div className="home-art" aria-label="StudyMate feature overview">

            <div className="home-art-kicker"><span>01</span><b>YOUR STUDY SPACE</b></div>

            <div className="home-hero-board">

              <div className="home-board-top"><span>STUDYMATE / 2026</span><span>01—04</span></div>

              <div className="home-board-title"><span>MAKE</span><strong>SPACE</strong><span>TO STUDY.</span></div>

              <div className="home-board-rule"></div>

              <div className="home-board-bottom"><span>SUBJECTS</span><span>TASKS</span><span>NOTES</span><span>FOCUS</span></div>

            </div>

            <div className="home-hero-note"><span>REMINDER / 02</span><strong>One thing.<br/>Then the next.</strong><small>STUDYMATE</small></div>

            <div className="home-hero-number">04</div>

            <div className="home-hero-line"></div>

          </div>

        </section>



        <div className="home-marquee" aria-hidden="true">

          <div className="home-marquee-track">

            <span>PLAN BETTER</span><i>✦</i><span>FOCUS DEEPER</span><i>✦</i><span>STAY CONSISTENT</span><i>✦</i><span>LEARN YOUR WAY</span><i>✦</i>

            <span>PLAN BETTER</span><i>✦</i><span>FOCUS DEEPER</span><i>✦</i><span>STAY CONSISTENT</span><i>✦</i><span>LEARN YOUR WAY</span><i>✦</i>

          </div>

        </div>



        <section id="story" className="home-story">

          <div className="home-story-number">01</div>

          <div className="home-story-heading">

            <span>WHY STUDYMATE</span>

            <h2>Studying shouldn't<br/>feel like managing<br/><em>another job.</em></h2>

          </div>

          <div className="home-story-text">

            <p>There are enough tabs, notebooks, reminders and scattered lists already.</p>

            <p>StudyMate gives those everyday study essentials a single home, so you can spend less effort organizing and more effort learning.</p>

            <Link to="/signup" className="home-story-link">Build your workspace <span>↗</span></Link>

          </div>

        </section>



        <section id="features" className="home-features">

          <div className="home-feature-intro">

            <span>02 — THE WORKSPACE</span>

            <h2>Everything<br/><em>where it belongs.</em></h2>

            <p>These are the tools currently available in StudyMate. No fake stats, no pretend data — just the parts you can actually use.</p>

          </div>

          <div className="home-feature-grid">

            {features.map((feature) => (

              <div className="home-option-card" key={feature.number}>

                <div className="home-option-top"><span>{feature.number}</span><b>{feature.title.toUpperCase()}</b><i>•</i></div>

                <div className="home-option-icon">{feature.mark}</div>

                <h3>{feature.title}<br/><em>{feature.title === "Focus" ? "your time." : feature.title === "Tasks" ? "under control." : feature.title === "Notes" ? "worth keeping." : "in one place."}</em></h3>

                <p>{feature.text}</p>

                <span className="home-option-link">Available in StudyMate <b>→</b></span>

              </div>

            ))}

          </div>

        </section>



        <section id="quotes" className="home-quotes">

          <div className="home-quotes-heading">

            <div><span>03 — A LITTLE PUSH</span><h2>When motivation<br/><em>needs a reminder.</em></h2></div>

            <p>Click any card. The quote opens as a focused poster with a smooth animation.</p>

          </div>



          <div className="home-quotes-grid">

            {quoteCards.map((quote) => (

              <button

                type="button"

                className={`home-quote-card ${quote.type === "text" ? "home-quote-written" : "home-quote-image"}`}

                key={quote.id}

                onClick={() => setActiveQuote(quote)}

                aria-label={`Open ${quote.title} quote`}

              >

                <span className="home-quote-kicker">{quote.kicker}</span>

                {quote.type === "image" ? (

                  <img src={quote.image} alt={quote.title} loading="lazy" decoding="async" referrerPolicy="no-referrer" />

                ) : (

                  <span className="home-written-content">

                    <strong>{quote.title}</strong>

                    <small>{quote.body}</small>

                    <i>OPEN QUOTE ↗</i>

                  </span>

                )}

              </button>

            ))}

          </div>

        </section>



        <section className="home-final">

          <div className="home-final-circle"></div>

          <span>04 — YOUR NEXT CHAPTER</span>

          <h2>Make studying<br/><em>feel different.</em></h2>

          <p>Start with a cleaner workspace and build your own study rhythm.</p>

          <Link to="/signup" className="home-final-button">Create your StudyMate <span>↗</span></Link>

        </section>

      </main>



      <footer className="home-footer">

        <Link to="/" className="home-brand"><span className="home-brand-mark">SM</span><span>StudyMate</span></Link>

        <span>Study smarter. Stay consistent.</span>

        <span>© 2026 StudyMate</span>

      </footer>



      {activeQuote && (

        <div className="quote-modal" role="dialog" aria-modal="true" aria-label={activeQuote.title} onClick={() => setActiveQuote(null)}>

          <button type="button" className="quote-modal-close" onClick={() => setActiveQuote(null)} aria-label="Close quote">×</button>

          <div className={`quote-modal-card ${activeQuote.type === "text" ? "quote-modal-written" : ""}`} onClick={(event) => event.stopPropagation()}>

            {activeQuote.type === "image" ? (

              <img src={activeQuote.image} alt={activeQuote.title} decoding="async" referrerPolicy="no-referrer" />

            ) : (

              <div className="quote-modal-copy">

                <span>{activeQuote.kicker}</span>

                <h3>{activeQuote.title}</h3>

                <p>{activeQuote.body}</p>

                <b>STUDYMATE</b>

              </div>

            )}

          </div>

        </div>

      )}

    </div>

  );

}



function App() {



  return (



    <Routes>



      <Route

        path="/"

        element={<Home />}

      />



      <Route

        path="/signup"

        element={<Signup />}

      />



      <Route

        path="/login"

        element={<Login />}

      />



      <Route

        path="/dashboard"

        element={<Dashboard />}

      />



      <Route

        path="/subjects"

        element={<Subjects />}

      />



      <Route

        path="/tasks"

        element={<Tasks />}

      />



      <Route

        path="/notes"

        element={<Notes />}

      />



      <Route

        path="/timer"

        element={<StudyTimer />}

      />



      <Route

        path="/planner"

        element={<Planner />}

      />



      <Route path="/calendar" element={<Calendar />} />

      <Route path="/goals" element={<Goals />} />

      <Route path="/analytics" element={<Analytics />} />

      <Route path="/habits" element={<Habits />} />



    </Routes>



  );

}





export default App;
