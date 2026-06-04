import { AlertTriangle, Clock, FileText } from "lucide-react";

export function ProblemSection() {
  const painPoints = [
    {
      title: "Your reports always rejected",
      description: "Minor compliance slip-ups lead to costly report rejections from LSMTL. Stay compliant automatically.",
      icon: AlertTriangle,
    },
    {
      title: "No timestamp tracking",
      description: "Without granular pipeline tracing, it is impossible to resolve turnaround bottlenecks and track inspector speed.",
      icon: Clock,
    },
    {
      title: "Manual proofreading errors",
      description: "Eyeballing calculations and boilerplate data manually is slow and prone to oversight. Let AI do the heavy lifting.",
      icon: FileText,
    },
  ];

  return (
    <section id="problems" className="w-full bg-white py-20 md:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Title */}
        <div className="text-center space-y-4">
          <h2 className="font-syne font-bold text-3xl sm:text-4xl lg:text-5xl text-slate-900 uppercase tracking-tight">
            Still managing NDT reports on Google Sheets?
          </h2>
          <p className="font-inter text-slate-600 text-lg max-w-2xl mx-auto">
            Traditional spreadsheets create overhead, lack tracing, and fail to prevent compliance rejection.
          </p>
        </div>

        {/* Pain Point Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {painPoints.map((point, i) => {
            const Icon = point.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 min-h-[220px] flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Sky blue icon */}
                  <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-syne font-bold text-lg text-slate-900 uppercase tracking-wider">
                    {point.title}
                  </h3>
                  <p className="font-inter text-slate-600 text-[16px] leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
