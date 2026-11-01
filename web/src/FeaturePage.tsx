import SidebarNav from "./SidebarNav";
import "./FeaturePage.css";

export default function FeaturePage({
  icon,
  eyebrow,
  title,
  description,
  index,
}) {
  return (
    <div className="feature-page">
      <SidebarNav />

      <main className="feature-main">
        <div className="feature-number">
          {index}
        </div>

        <p className="feature-eyebrow">
          {eyebrow}
        </p>

        <h1>{title}</h1>

        <p className="feature-description">
          {description}
        </p>

        <section className="feature-placeholder">
          <div className="placeholder-icon">
            {icon}
          </div>

          <p>COMING NEXT</p>

          <h2>
            {title} is planned for the next StudyMate build.
          </h2>

          <span>
            This route is already wired into the app. We will replace
            this screen with the full feature later without changing
            the navigation.
          </span>
        </section>
      </main>
    </div>
  );
}