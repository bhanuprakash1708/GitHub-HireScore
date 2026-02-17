"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function extractUsername(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // If it's just a username
  if (!trimmed.includes("http")) {
    return trimmed.replace(/^@/, "");
  }

  try {
    const url = new URL(trimmed);
    if (!url.hostname.includes("github.com")) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return null;
    return parts[0];
  } catch {
    return null;
  }
}

export default function HomePage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const username = extractUsername(input);
    if (!username) {
      setError("Please enter a valid GitHub profile URL or username.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    router.push(`/analyze?username=${encodeURIComponent(username)}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <header className="border-b border-white/20 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-900 shadow-sm shadow-slate-900/40">
              GP
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">
                GitHub Portfolio Analyzer
              </p>
              {/* <p className="text-[11px] text-slate-400">
                Built for UnsaidTalks - Recruiter-style GitHub intelligence
              </p> */}
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-full border border-slate-700 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-300">
              0-100 Portfolio Score
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-stretch px-4 py-10">
        <div className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-[1.15fr,0.95fr]">
          <section className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Turn your GitHub into
                <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 bg-clip-text text-transparent">
                  {" "}
                  recruiter-ready proof.
                </span>
              </h1>
              <p className="max-w-xl text-sm text-slate-300 sm:text-base">
                Paste your GitHub profile and we&apos;ll translate your repos, commits, and
                documentation into a recruiter-style score, strengths, red flags, and a concrete
                action plan.
              </p>
            </div>

            <Card className="border-white/20 bg-slate-900/90 text-slate-100 shadow-2xl shadow-slate-950/60">
              <CardHeader className="border-b border-white/20">
                <CardTitle className="text-lg font-semibold text-slate-100">
                  Analyze your GitHub portfolio
                </CardTitle>
                <CardDescription className="text-sm text-slate-300">
                  We pull only public GitHub data and run a recruiter-style evaluation on
                  documentation, code structure, activity, impact, and organization.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium uppercase tracking-wide text-slate-100">
                      GitHub profile URL or username
                    </label>
                    <Input
                      className="border-slate-700/80 bg-slate-950/70 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:ring-sky-500"
                      placeholder="e.g. https://github.com/torvalds or torvalds"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                    />
                    {error && (
                      <p className="text-xs font-medium text-rose-400">{error}</p>
                    )}
                    <p className="text-xs text-slate-300">
                      Tip: Start with your own username, then compare with senior engineers you
                      admire.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-sky-500 text-slate-950 hover:bg-sky-400 sm:w-auto"
                      isLoading={isSubmitting}
                    >
                      Run Portfolio Analysis
                    </Button>
                    <p className="text-xs text-slate-300">
                      No tokens from you. We use server-side GitHub + Gemini integrations.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>

            <section className="grid gap-4 text-sm text-slate-300 sm:grid-cols-3">
              <div className="rounded-xl border border-white/20 bg-slate-900/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  For recruiters
                </p>
                <p className="mt-2 text-base font-medium text-slate-50">
                  Portfolio at a glance
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  See how your GitHub would feel in a hiring pipeline, not just as raw stats.
                </p>
              </div>
              <div className="rounded-xl border border-white/20 bg-slate-900/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Scoring engine
                </p>
                <p className="mt-2 text-base font-medium text-slate-50">
                  Transparent 0-100 score
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Documentation, structure, activity, impact, and organization - each with its own
                  weight.
                </p>
              </div>
              <div className="rounded-xl border border-white/20 bg-slate-900/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  AI assist
                </p>
                <p className="mt-2 text-base font-medium text-slate-50">
                  Actionable next steps
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Gemini turns your metrics into strengths, red flags, and a prioritized action
                  plan.
                </p>
              </div>
            </section>
          </section>

          <section className="flex flex-col gap-4">
            <Card className="border-white/20 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-sky-900/40 shadow-2xl shadow-slate-950/70">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-50">
                  What you&apos;ll see in your report
                </CardTitle>
                <CardDescription className="text-sm text-slate-400">
                  Designed to look and read like a recruiter&apos;s internal notes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 text-sm text-slate-200">
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <span className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border border-slate-700 text-center text-xs leading-5">
                      1
                    </span>
                    <span>
                      A **0-100 GitHub Portfolio Score** with a band label: Recruiter Ready, Strong
                      but Improvable, Needs Optimization, or Major Improvements Needed.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border border-slate-700 text-center text-xs leading-5">
                      2
                    </span>
                    <span>
                      A **radar chart** showing balance across documentation, structure, activity,
                      impact, technical depth, and organization.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border border-slate-700 text-center text-xs leading-5">
                      3
                    </span>
                    <span>
                      A recruiter-style **summary, strengths, red flags**, and a **90-day action
                      plan** written by Gemini.
                    </span>
                  </li>
                </ul>
                <div className="mt-2 rounded-lg border border-white/20 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
                  <p className="font-medium text-slate-100">Quick test profiles</p>
                  <p className="mt-1">
                    Try usernames like <span className="font-mono text-sky-300">torvalds</span>,{" "}
                    <span className="font-mono text-sky-300">gaearon</span>, or{" "}
                    <span className="font-mono text-sky-300">vercel</span> to quickly see how the
                    scoring behaves.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/20 bg-slate-900/70 shadow-xl shadow-slate-950/60">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-50">
                  PDF portfolio report export
                </CardTitle>
                <CardDescription className="text-sm text-slate-300">
                  Download a print-ready report after analysis for applications, mentor reviews, and
                  progress tracking.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <p>The PDF includes:</p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>Candidate snapshot and full score breakdown.</li>
                  <li>Recruiter-style summary, strengths, red flags, and 90-day action plan.</li>
                  <li>Repository table with stars, updates, README status, and commit activity.</li>
                </ul>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}


