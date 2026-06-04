import {
  TrendingUp,
  Brain,
  Award,
  Search,
  WifiOff,
  Building2,
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      title: "Project Pipeline",
      description: "9-stage tracking from site inspection to technical report delivery. Know exactly where every project stands in real-time.",
      icon: TrendingUp,
      className: "lg:col-span-2",
    },
    {
      title: "AI Proofreader",
      description: "LSMTL guideline checking powered by Claude AI. Automatically flag boilerplate omissions and structural inconsistencies.",
      icon: Brain,
      className: "lg:col-span-1",
    },
    {
      title: "Staff Efficiency Scores",
      description: "Automated monthly performance reports tracking speed, volume, and quality of reports completed by each team member.",
      icon: Award,
      className: "lg:col-span-1",
    },
    {
      title: "Report Search",
      description: "Find any report in seconds by client, ndt code, address, or technical parameter with powerful filters.",
      icon: Search,
      className: "lg:col-span-1",
    },
    {
      title: "Offline-First PWA",
      description: "Works on Android and low-connectivity environments without internet. Cache data locally and sync when back online.",
      icon: WifiOff,
      className: "lg:col-span-1",
    },
    {
      title: "Multi-Lab SaaS",
      description: "Each laboratory gets a completely isolated, secure workspace with custom prefixes, prefix controls, and member hierarchies.",
      icon: Building2,
      className: "lg:col-span-3",
    },
  ];

  return (
    <section className="w-full bg-[#F8F9FA] py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-y border-slate-100">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Title */}
        <div className="text-center space-y-4">
          <h2 className="font-syne font-bold text-3xl sm:text-4xl lg:text-5xl text-slate-900 uppercase tracking-tight">
            Everything your lab needs
          </h2>
          <p className="font-inter text-slate-600 text-lg max-w-2xl mx-auto">
            A comprehensive, digital-first operations deck designed for modern NDT laboratories.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className={`bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300 min-h-[220px] ${feature.className}`}
              >
                <div className="space-y-4">
                  {/* Icon with light sky-blue background */}
                  <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-syne font-bold text-xl text-slate-900 uppercase tracking-wide">
                    {feature.title}
                  </h3>
                  <p className="font-inter text-slate-600 text-sm leading-relaxed">
                    {feature.description}
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
