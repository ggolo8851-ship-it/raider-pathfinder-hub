import { MD_GRADUATION_REQUIREMENTS } from "@/lib/store";

const GraduationPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-5">
      <h2 className="text-3xl font-bold text-primary mb-2">🎓 Maryland Graduation Requirements</h2>
      <p className="text-muted-foreground mb-2">Standard Maryland High School graduation requirements — Class of 2026 (22 credits)</p>
      <p className="text-xs text-muted-foreground mb-8">Source: <a href="https://www.pgcps.org/offices/curriculum-and-instruction/graduation-requirements" target="_blank" rel="noopener noreferrer" className="text-primary underline">PGCPS Graduation Requirements ↗</a></p>

      <div className="bg-card rounded-2xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-primary mb-4">📋 Required Credits</h3>
        <div className="space-y-2">
          {MD_GRADUATION_REQUIREMENTS.map((req, i) => {
            const isTotal = req.subject.includes("Total") || req.subject.includes("SSL");
            return (
              <div key={i} className={`flex justify-between items-center p-3 rounded-lg ${
                isTotal ? "bg-primary/10 font-bold border-2 border-primary" : "bg-muted/30"
              }`}>
                <span className="text-foreground">{req.subject}</span>
                <span className={`font-semibold ${isTotal ? "text-primary text-lg" : "text-secondary"}`}>{req.credits}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-primary mb-4">📝 Important Notes</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>• <b>Mathematics:</b> Must include Algebra I or higher. Students should take math every year.</p>
          <p>• <b>Science:</b> Must include Biology and at least one lab science (Chemistry recommended).</p>
          <p>• <b>Social Studies:</b> Must include US History, World History, and Government.</p>
          <p>• <b>World Language:</b> 2 credits in the same language, or Advanced Technology Education courses may substitute.</p>
          <p>• <b>Student Service Learning (SSL):</b> 24 hours of approved community service required for graduation.</p>
          <p>• <b>S/T Students:</b> Additional requirements include math through Pre-Calculus Honors or higher, and 3-4 advanced STEM credits with at least one AP.</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-primary mb-4">🔗 Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="https://www.pgcps.org/offices/student-services/school-counseling" target="_blank" rel="noopener noreferrer"
            className="bg-muted/30 p-4 rounded-lg hover:bg-muted/50 transition-colors">
            <p className="font-semibold text-foreground">PGCPS Counseling Services ↗</p>
            <p className="text-sm text-muted-foreground">Talk to your counselor about your graduation plan</p>
          </a>
          <a href="https://marylandpublicschools.org/about/Pages/DCCR/graduation.aspx" target="_blank" rel="noopener noreferrer"
            className="bg-muted/30 p-4 rounded-lg hover:bg-muted/50 transition-colors">
            <p className="font-semibold text-foreground">MSDE Graduation Requirements ↗</p>
            <p className="text-sm text-muted-foreground">Maryland State Department of Education official page</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default GraduationPage;
