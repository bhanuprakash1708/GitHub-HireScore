import { NextRequest, NextResponse } from "next/server";
import { analyzePortfolio } from "@/lib/github";
import { computePortfolioScore } from "@/lib/scoring";
import { generateAiFeedback } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const usernameRaw = (body?.username as string | undefined)?.trim();

    if (!usernameRaw) {
      return NextResponse.json(
        { error: "Missing GitHub username." },
        { status: 400 }
      );
    }

    const username = usernameRaw.replace(/^@/, "");

    console.log("[analyze] Start analysis for", username);

    const metrics = await analyzePortfolio(username);
    const score = computePortfolioScore(metrics);
    const aiFeedback = await generateAiFeedback(metrics, score);

    console.log("[analyze] Completed analysis for", username, "score:", score.total);

    return NextResponse.json(
      {
        metrics,
        score,
        aiFeedback
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[analyze] Error:", error);
    const message =
      typeof error?.message === "string"
        ? error.message
        : "Unexpected error while analyzing GitHub profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

