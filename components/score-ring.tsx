import React from "react";
import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  label?: string;
}

export function ScoreRing({ score, label }: ScoreRingProps) {
  const radius = 80;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth;
  const circumference = normalizedRadius * 2 * Math.PI;
  const clamped = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 85
      ? "#22c55e"
      : clamped >= 70
      ? "#22d3ee"
      : clamped >= 50
      ? "#f59e0b"
      : "#f43f5e";

  return (
    <div className="flex flex-col items-center justify-center">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="rgba(255,255,255,0.25)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          className={cn("origin-center -rotate-90 transform")}
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="fill-slate-100 text-3xl font-semibold"
        >
          {clamped}
        </text>
      </svg>
      {label && <p className="mt-2 text-sm font-medium text-slate-300">{label}</p>}
    </div>
  );
}

