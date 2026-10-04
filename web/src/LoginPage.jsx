import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "./api";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser(email.trim(), password);

      if (!data || data.message !== "Login successful!") {
        setMessage(data?.message || "Invalid email or password.");
        return;
      }

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userId", String(data.id));
      localStorage.setItem("userName", data.name || "Student");
      localStorage.setItem("userEmail", data.email || email.trim());

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      setMessage(
        error?.message ||
          "Unable to connect to StudyMate. Please check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
      <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
      <div className="login-grain" aria-hidden="true" />

      <header className="login-topbar">
        <Link to="/" className="login-brand" aria-label="StudyMate home">
          <span className="login-brand-mark">SM</span>
          <span>
            <strong>StudyMate</strong>
            <small>YOUR STUDY SPACE</small>
          </span>
        </Link>

        <Link to="/" className="login-back">
          <span>←</span>
          Back home
        </Link>
      </header>

      <section className="login-layout">
        <div className="login-copy">
          <p className="login-eyebrow">01 / WELCOME BACK</p>

          <h1>
            Your study space,
            <br />
            <em>right where you left it.</em>
          </h1>

          <p className="login-description">
            Pick up your subjects, tasks, notes and focused study sessions
            without starting over.
          </p>

          <div className="login-manifesto">
            <span className="login-manifesto-number">SM / 01</span>
            <p>Plan clearly. Focus quietly. Keep moving.</p>
          </div>

          <div className="login-points">
            <span><b>01</b> Keep your subjects together</span>
            <span><b>02</b> Stay on top of daily tasks</span>
            <span><b>03</b> Protect your study time</span>
          </div>
        </div>

        <div className="login-card-wrap">
          <div className="login-card">
            <div className="login-card-topline">
              <span>STUDYMATE / ACCOUNT</span>
              <span>01—02</span>
            </div>

            <div className="login-card-header">
              <div>
                <p>WELCOME BACK</p>
                <h2>Log in.</h2>
                <span>Continue where you left off.</span>
              </div>

              <div className="login-card-symbol">↗</div>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <label className="login-field">
                <span>Email address</span>
                <div className="login-input-wrap">
                  <span className="input-mark">@</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </label>

              <label className="login-field">
                <span>Password</span>
                <div className="login-input-wrap">
                  <span className="input-mark">•</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={loading}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              {message && (
                <div className="login-message" role="alert">
                  <span>!</span>
                  {message}
                </div>
              )}

              <button className="login-submit" type="submit" disabled={loading}>
                <span>{loading ? "Signing in…" : "Continue to StudyMate"}</span>
                <b>→</b>
              </button>
            </form>

            <div className="login-divider">
              <span>OR</span>
            </div>

            <p className="login-signup">
              New to StudyMate?
              <Link to="/signup">Create an account</Link>
            </p>

            <div className="login-card-footer">
              <span>STUDY / FOCUS / PROGRESS</span>
              <span>© 2026</span>
            </div>
          </div>

          <p className="login-footer-note">
            A calmer place to study, one session at a time.
          </p>
        </div>
      </section>
    </main>
  );
}
