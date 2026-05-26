"use client";

import { useEffect, useState } from "react";

export function ScoreGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Simple animation effect on mount
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  let color = "text-amber-500";
  if (score >= 80) color = "text-emerald-500";
  else if (score < 50) color = "text-red-500";

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Background track */}
      <svg className="w-12 h-12 transform -rotate-90">
        <circle
          className="text-border"
          strokeWidth="4"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="24"
          cy="24"
        />
        {/* Animated fill */}
        <circle
          className={`${color} transition-all duration-1000 ease-out`}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="24"
          cy="24"
        />
      </svg>
      {/* Score text */}
      <span className="absolute text-sm font-bold text-foreground">
        {Math.round(animatedScore)}
      </span>
    </div>
  );
}
