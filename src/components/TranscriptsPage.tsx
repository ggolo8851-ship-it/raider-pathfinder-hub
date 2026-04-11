import { ERHS_COUNSELORS } from "@/lib/store";

const TranscriptsPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-5">
      <h2 className="text-3xl font-bold text-primary mb-2">📄 Transcripts & Counseling</h2>
      <p className="text-muted-foreground mb-8">Request transcripts and connect with your school counselor</p>

      <div className="bg-card rounded-2xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-primary mb-4">Request Your Transcript</h3>
        <p className="text-muted-foreground mb-4">
          Official transcripts are ordered through <b>ScribOrder</b>. Click below to start your request.
          Contact your counselor if you need help with the process.
        </p>
        <a href="https://pgcpsmd.scriborder.com/" target="_blank" rel="noopener noreferrer"
          className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
          Order Transcript via ScribOrder ↗
        </a>
      </div>

      <h3 className="text-xl font-bold text-primary mb-4">🧑‍🏫 Your School Counselors</h3>
      <p className="text-sm text-muted-foreground mb-4">Find your counselor based on your last name. Call the school main office at <b>(301) 513-5400</b> to reach any counselor.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {ERHS_COUNSELORS.map((c, i) => (
          <div key={i} className="bg-card rounded-xl shadow-sm p-5 border-l-4 border-secondary">
            <p className="font-bold text-foreground text-lg">{c.name}</p>
            <p className="text-sm text-muted-foreground mb-2">Last Names: <b>{c.alpha}</b></p>
            <p className="text-sm">📧 <a href={`mailto:${c.email}`} className="text-primary underline">{c.email}</a></p>
            <p className="text-sm">📞 ERHS Main Office: {c.phone}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-primary mb-4">📎 Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="https://www.pgcps.org/offices/student-services/school-counseling/schoolinks" target="_blank" rel="noopener noreferrer"
            className="bg-muted/30 p-4 rounded-lg hover:bg-muted/50 transition-colors">
            <p className="font-semibold text-foreground">SchooLinks 🔗</p>
            <p className="text-sm text-muted-foreground">College & career planning platform</p>
          </a>
          <a href="https://www.pgcps.org/schools/eleanor-roosevelt-high" target="_blank" rel="noopener noreferrer"
            className="bg-muted/30 p-4 rounded-lg hover:bg-muted/50 transition-colors">
            <p className="font-semibold text-foreground">ERHS School Page 🏫</p>
            <p className="text-sm text-muted-foreground">PGCPS official school page</p>
          </a>
          <a href="https://www.pgcps.org/offices/student-services/school-counseling/scholarships" target="_blank" rel="noopener noreferrer"
            className="bg-muted/30 p-4 rounded-lg hover:bg-muted/50 transition-colors">
            <p className="font-semibold text-foreground">Scholarships 🎓</p>
            <p className="text-sm text-muted-foreground">PGCPS scholarship listings</p>
          </a>
          <a href="https://studentaid.gov/h/apply-for-aid/fafsa" target="_blank" rel="noopener noreferrer"
            className="bg-muted/30 p-4 rounded-lg hover:bg-muted/50 transition-colors">
            <p className="font-semibold text-foreground">FAFSA 💰</p>
            <p className="text-sm text-muted-foreground">Federal student aid application</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default TranscriptsPage;
