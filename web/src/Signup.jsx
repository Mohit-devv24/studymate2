import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Signup.css";
import { apiFetch } from "./api";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.id) {
        setMessage(data?.detail || data?.message || "Unable to create your account.");
        return;
      }

      navigate("/login", {
        state: { message: "Account created successfully. Log in to continue." },
      });
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
    <main className="signup-page">
      <div className="signup-orbit signup-orbit-one" aria-hidden="true" />
      <div className="signup-orbit signup-orbit-two" aria-hidden="true" />
      <div className="signup-grain" aria-hidden="true" />

      <header className="signup-topbar">
        <Link to="/" className="signup-brand" aria-label="StudyMate home">
          <span className="signup-brand-mark">SM</span>
          <span>
            <strong>StudyMate</strong>
            <small>YOUR STUDY SPACE</small>
          </span>
        </Link>

        <Link to="/" className="signup-back">
          <span>←</span>
          Back home
        </Link>
      </header>

      <section className="signup-layout">
        <div className="signup-copy">
          <p className="signup-eyebrow">01 / START HERE</p>

          <h1>
            Build your
            <br />
            <em>own study rhythm.</em>
          </h1>

          <p className="signup-description">
            Create one calm place for the things you use every day while
            studying — then make it yours.
          </p>

          <div className="signup-stack">
            <div className="signup-note">
              <span>01</span>
              <div>
                <strong>One place.</strong>
                <p>Less switching. More studying.</p>
              </div>
            </div>

            <div className="signup-note">
              <span>02</span>
              <div>
                <strong>Your pace.</strong>
                <p>Keep your workflow simple and visible.</p>
              </div>
            </div>

            <div className="signup-note">
              <span>03</span>
              <div>
                <strong>Your progress.</strong>
                <p>Turn small sessions into a consistent habit.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="signup-card-wrap">
          <div className="signup-card">
            <div className="signup-card-topline">
              <span>STUDYMATE / NEW ACCOUNT</span>
              <span>01—03</span>
            </div>

            <div className="signup-card-header">
              <div>
                <p>NEW HERE?</p>
                <h2>Create account.</h2>
                <span>Set up your study space in a minute.</span>
              </div>
              <div className="signup-card-symbol">↗</div>
            </div>

            <form onSubmit={handleSignup} className="signup-form">
              <label className="signup-field">
                <span>Your name</span>
                <div className="signup-input-wrap">
                  <span className="signup-input-mark">01</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
              </label>

              <label className="signup-field">
                <span>Email address</span>
                <div className="signup-input-wrap">
                  <span className="signup-input-mark">@</span>
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

              <label className="signup-field">
                <span>Password</span>
                <div className="signup-input-wrap">
                  <span className="signup-input-mark">•</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="signup-password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={loading}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <label className="signup-field">
                <span>Confirm password</span>
                <div className="signup-input-wrap">
                  <span className="signup-input-mark">•</span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="signup-password-toggle"
                    onClick={() => setShowConfirm((value) => !value)}
                    disabled={loading}
                  >
                    {showConfirm ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              {message && (
                <div className="signup-message" role="alert">
                  <span>!</span>
                  {message}
                </div>
              )}

              <button type="submit" className="signup-submit" disabled={loading}>
                <span>{loading ? "Creating account…" : "Create my account"}</span>
                <b>→</b>
              </button>
            </form>

            <div className="signup-divider">
              <span>OR</span>
            </div>

            <p className="signup-login">
              Already have an account?
              <Link to="/login">Log in</Link>
            </p>

            <div className="signup-card-footer">
              <span>STUDY / FOCUS / PROGRESS</span>
              <span>© 2026</span>
            </div>
          </div>

          <p className="signup-footer-note">
            Start small. Keep showing up.
          </p>
        </div>
      </section>
    </main>
  );
}
