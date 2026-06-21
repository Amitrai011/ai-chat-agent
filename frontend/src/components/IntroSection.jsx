const IntroSection = () => {
  return (
    <section className="intro-section" aria-labelledby="page-title">
      <a className="brand" href="/" aria-label="Acme and Company home">
        <span className="brand-mark">A</span>
        <span>Acme & Co.</span>
      </a>
      <div className="intro-copy">
        <p className="eyebrow">Customer care, reimagined</p>
        <h1 id="page-title">
          Questions happen.
          <br />
          We're right here.
        </h1>
        <p>
          Ask about shipping, returns, or anything else. Our AI support agent
          knows the essentials and is ready to help.
        </p>
        <div className="trust-line">
          <span className="avatar-stack" aria-hidden="true">
            <i>J</i>
            <i>M</i>
            <i>S</i>
          </span>
          <span>Backed by a real support team</span>
        </div>
      </div>
      <p className="intro-footer">Thoughtful goods for everyday living.</p>
    </section>
  );
};

export default IntroSection;
