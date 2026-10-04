import { Link } from "react-router-dom";
import "./SiteFooter.css";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <Link to="/" className="site-footer-logo">
            <span className="site-footer-mark">SM</span>

            <span className="site-footer-brand-text">
              <strong>StudyMate</strong>
              <small>YOUR STUDY SPACE</small>
            </span>
          </Link>

          <p>Study smarter. Stay consistent.</p>
        </div>

        <div className="site-footer-about">
          <span className="site-footer-label">BUILT & POWERED BY</span>
          <strong>Mohit Goyal</strong>
          <span className="site-footer-role">
            Full-Stack Developer & Student
          </span>
        </div>

        <div className="site-footer-connect">
          <span className="site-footer-label">CONNECT</span>

          <div className="site-footer-socials">
            <a
              href="https://www.linkedin.com/in/mohit-goyal-tech"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn ↗
            </a>

            <a
              href="https://www.instagram.com/yaarr2410?stkn=MWpqZ292bjN0a29pcw=="
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram ↗
            </a>
          </div>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© 2026 StudyMate</span>
        <span>Designed & developed by Mohit Goyal</span>
      </div>
    </footer>
  );
}
