function About() {
  return (
    <div className="page about-page page-enter">
      <p className="eyebrow">The Chronicle of Iron Vault</p>
      <h1 className="display">Forged in the old kingdom.<br />Kept for a new age.</h1>
      <p className="lede">
        Every vault has a tale. Ours began beside the western road, where a humble forge kept watch over merchants, travelers, and the town beyond its gates.
      </p>
      <section className="about-story">
        <div className="about-seal" aria-hidden="true">IV</div>
        <div>
          <h2>A keeper of craft and character</h2>
          <p>In the age of stone keeps and candlelit halls, a village smith was entrusted with more than iron. The forge became a meeting place: a promise that every object would be examined with care, described plainly, and treated with respect.</p>
          <p>Generations passed. The old forge became the Iron Vault, a modern collection inspired by that same oath. Today we bring together a considered catalogue of sporting pieces and accessories, with clear details and service worthy of the house crest.</p>
          <p className="about-signoff">Keep the craft. Honor the story. Choose with care.</p>
        </div>
      </section>
      <div className="about-values">
        <article><span>01</span><h3>Plain dealing</h3><p>Useful details, honest descriptions, and no hidden surprises.</p></article>
        <article><span>02</span><h3>Careful craft</h3><p>A thoughtful collection chosen for quality and lasting character.</p></article>
        <article><span>03</span><h3>Respect first</h3><p>Responsible ownership and local rules belong in every chapter.</p></article>
      </div>
    </div>
  )
}

export default About
