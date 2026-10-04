import "./FeaturePlaceholder.css";

function FeaturePlaceholder({ title, number, description }) {
  return (
    <main className="feature-page">
      <div className="feature-wrap">
        <p className="feature-kicker">{number} / STUDYMATE</p>
        <h1>{title}</h1>
        <p>{description}</p>

        <section className="feature-card">
          <span>COMING NEXT</span>
          <strong>This space is reserved for {title}.</strong>
          <small>The navigation is ready. We will build the full functionality here next.</small>
        </section>
      </div>
    </main>
  );
}

export default FeaturePlaceholder;
