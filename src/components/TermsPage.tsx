const TermsPage = () => (
  <div className="max-w-4xl mx-auto py-10 px-5">
    <h2 className="text-3xl font-bold text-primary mb-1">📜 Terms & Privacy</h2>
    <p className="text-sm text-muted-foreground mb-6">Last Updated: May 2026 — the full legal document you agreed to at signup.</p>

    <article className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4 text-sm leading-relaxed">
      <header>
        <h3 className="text-lg font-bold">RaiderMatch Legal & Privacy Policy</h3>
      </header>

      <p>
        RaiderMatch is an educational college exploration platform designed to help students understand potential
        college options using academic information, interests, and optional survey responses. This document
        includes our Privacy Policy, Terms of Service, and Educational Compliance Statement.
      </p>

      <section>
        <h4 className="font-semibold text-base mt-4">1. Privacy Policy</h4>
        <h5 className="font-semibold mt-2">1.1 Information We Collect</h5>
        <ul className="list-disc pl-5">
          <li>Name and email (for account access)</li>
          <li>Academic information (if voluntarily provided)</li>
          <li>Portfolio or extracurricular information (if provided)</li>
          <li>Vibe or interest-based quiz responses</li>
          <li>Basic usage data (pages visited, feature interactions)</li>
        </ul>
        <p>Students control what they choose to submit.</p>

        <h5 className="font-semibold mt-2">1.2 How We Use Information</h5>
        <p>Information is used only to generate college exploration and matching results, provide educational
          guidance, improve platform accuracy, and personalize the experience. We do <b>not</b> provide official
          admissions decisions or guarantees.</p>

        <h5 className="font-semibold mt-2">1.3 Data Processing & Admin Access Restrictions</h5>
        <p>All data is processed automatically through system algorithms. Administrators do not perform manual
          review of personal student profiles; data is used only for automated matching.</p>

        <h5 className="font-semibold mt-2">1.4 Analytics</h5>
        <p>We use analytics tools (including Lovable and Google Analytics). Data is anonymized and aggregated and
          used only to improve performance.</p>

        <h5 className="font-semibold mt-2">1.5 Data Security</h5>
        <p>We use secure cloud storage and access-controlled systems. No system is fully secure, so users should
          avoid submitting sensitive data (passwords, financial information, etc.).</p>

        <h5 className="font-semibold mt-2">1.6 Data Sharing</h5>
        <p>We do <b>not</b> sell data, share data for advertising, or provide data to third parties for marketing.
          Data may only be shared if legally required.</p>

        <h5 className="font-semibold mt-2">1.7 User Control</h5>
        <p>Users may update or delete their account, control what information they provide, and stop using the
          platform at any time.</p>

        <h5 className="font-semibold mt-2">1.8 Educational Disclaimer</h5>
        <p>RaiderMatch is a guidance tool only. It does not guarantee admission and does not replace school
          counseling. All results are informational estimates.</p>
      </section>

      <section>
        <h4 className="font-semibold text-base mt-4">2. Terms & Conditions</h4>
        <p><b>2.1 Platform Use:</b> Use the platform for educational purposes only, provide accurate information,
          and avoid misuse, hacking, or disruption.</p>
        <p><b>2.2 Accounts:</b> Each user is responsible for their account security.</p>
        <p><b>2.3 Content & Results:</b> All college matches are algorithm-generated estimates.</p>
        <p><b>2.4 Prohibited Use:</b> No harmful or fake data, no disruption of system operations, no illegal
          activity.</p>
        <p><b>2.5 Termination:</b> We may restrict access for users who violate these terms.</p>
        <p><b>2.6 Changes:</b> Terms may be updated; continued use means acceptance of updates.</p>
      </section>

      <section>
        <h4 className="font-semibold text-base mt-4">3. Educational Compliance (COPPA + FERPA-Aligned)</h4>
        <p><b>3.1 COPPA:</b> Minimal data collection. No data sold or used for advertising. Parental consent
          mechanisms may be used where required.</p>
        <p><b>3.2 FERPA:</b> Student data is used only for educational guidance. RaiderMatch is <b>not</b> an
          educational institution and does not store or modify official school records.</p>
        <p><b>3.3 Data Access Protection:</b> Data is processed automatically; no admin views individual student
          data directly.</p>
        <p><b>3.4 Educational Purpose Only:</b> Designed for college exploration, academic guidance, and career
          interest discovery. Not a replacement for official school counseling or admissions systems.</p>
      </section>

      <section>
        <h4 className="font-semibold text-base mt-4">4. Contact</h4>
        <p>📩 Instagram: @erhstudentsforsuccess</p>
      </section>
    </article>
  </div>
);

export default TermsPage;
