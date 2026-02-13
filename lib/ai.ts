import { GoogleGenAI } from "@google/genai";
import { AiFeedback, PortfolioMetrics, PortfolioScore } from "@/types/github";

const AI_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

type AiCacheEntry = {
  timestamp: number;
  data: AiFeedback;
};

const aiFeedbackCache = new Map<string, AiCacheEntry>();
const aiFeedbackInFlight = new Map<string, Promise<AiFeedback>>();

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
}

function getAiCacheKey(metrics: PortfolioMetrics, score: PortfolioScore): string {
  const b = score.breakdown;
  return [
    metrics.user.login.toLowerCase(),
    score.total,
    b.documentation.toFixed(2),
    b.codeStructure.toFixed(2),
    b.activity.toFixed(2),
    b.technicalDepth.toFixed(2),
    b.impact.toFixed(2),
    b.organization.toFixed(2),
    metrics.repos.length
  ].join("|");
}

function fromAiCache(key: string): AiFeedback | null {
  const entry = aiFeedbackCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > AI_CACHE_TTL_MS) {
    aiFeedbackCache.delete(key);
    return null;
  }
  return entry.data;
}

function setAiCache(key: string, data: AiFeedback) {
  aiFeedbackCache.set(key, { timestamp: Date.now(), data });
}

function extractTextFromGeminiResponse(response: any): string {
  const fromTopLevelText = typeof response?.text === "string" ? response.text : "";
  const fromResponseText =
    typeof response?.response?.text === "string" ? response.response.text : "";

  const fromCandidates = [response?.candidates, response?.response?.candidates]
    .flat()
    .filter(Boolean)
    .flatMap((c: any) => c.content?.parts ?? [])
    .map((p: any) => p?.text)
    .filter((t: any) => typeof t === "string")
    .join("\n");

  return fromTopLevelText || fromResponseText || fromCandidates || "";
}

function parseJsonPayload(text: string): any {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    const withoutFenceStart = trimmed.replace(/^```(?:json)?\s*/i, "");
    const withoutFenceEnd = withoutFenceStart.replace(/\s*```$/, "");
    return JSON.parse(withoutFenceEnd);
  }
  return JSON.parse(trimmed);
}

export async function generateAiFeedback(
  metrics: PortfolioMetrics,
  score: PortfolioScore
): Promise<AiFeedback> {
  const cacheKey = getAiCacheKey(metrics, score);
  const cached = fromAiCache(cacheKey);
  if (cached) return cached;

  const inFlight = aiFeedbackInFlight.get(cacheKey);
  if (inFlight) return inFlight;

  const requestPromise = (async () => {
    try {
      const client = getGeminiClient();

      const topRepos = [...metrics.repos]
        .sort((a, b) => b.repo.stargazers_count - a.repo.stargazers_count)
        .slice(0, 5)
        .map((r) => ({
          name: r.repo.name,
          description: r.repo.description,
          stars: r.repo.stargazers_count,
          forks: r.repo.forks_count,
          language: r.repo.language,
          readme: {
            hasReadme: r.readmePresent,
            length: r.readmeLength,
            hasInstallation: r.hasInstallationSection,
            hasUsage: r.hasUsageSection,
            hasFeatures: r.hasFeaturesSection,
            hasScreenshots: r.hasScreenshotsSection,
            hasBadges: r.hasBadges
          },
          activity90d: r.commitCount90d,
          lastCommitDate: r.lastCommitDate
        }));

      const systemPrompt =
        "You are a senior technical recruiter evaluating GitHub portfolios. " +
        "You are specific, concise, and brutally honest but constructive. " +
        "You care about real-world readiness, clarity, and consistency.";

      const userPrompt = `
GitHub portfolio snapshot:
- Username: ${metrics.user.login}
- Followers: ${metrics.user.followers}
- Public repos: ${metrics.user.public_repos}

Score breakdown (0-100 total):
- Documentation Quality (20): ${score.breakdown.documentation.toFixed(1)}
- Code Structure & Best Practices (20): ${score.breakdown.codeStructure.toFixed(1)}
- Activity Consistency (20): ${score.breakdown.activity.toFixed(1)}
- Technical Depth (15): ${score.breakdown.technicalDepth.toFixed(1)}
- Impact & Relevance (15): ${score.breakdown.impact.toFixed(1)}
- Repository Organization (10): ${score.breakdown.organization.toFixed(1)}
- Total Score: ${score.total} / 100
- Rating Band: ${score.band}

Top repositories (max 5):
${JSON.stringify(topRepos, null, 2)}

TASK:
1. Write a short recruiter-style overall summary (3-5 sentences) on how this profile would look in a hiring pipeline.
2. List 3-5 specific strengths as short bullet points.
3. List 3-7 concrete red flags or weaknesses as short bullet points (focus on what would worry a hiring manager).
4. Provide 3-7 prioritized, actionable improvement suggestions (each should start with a verb and be something they could reasonably do in < 1 week per item).

Constraints:
- Be specific to the metrics above; do NOT be generic.
- Explicitly reference patterns you see (e.g. "Your most active repo is X", "Most repos lack READMEs", "Stars are concentrated in one small toy project", etc.).
- The tone should be professional and direct, not fluffy.

Respond in JSON with the following shape:
{
  "summary": "string",
  "strengths": ["..."],
  "redFlags": ["..."],
  "actionItems": ["..."]
}
`;

      const modelsToTry = ["gemini-1.5-flash-8b", "gemini-1.5-flash", "gemini-2.5-flash"];
      let response: any = null;
      let lastModelError: any = null;

      for (const modelName of modelsToTry) {
        try {
          response = await client.models.generateContent({
            model: modelName,
            contents: [
              {
                role: "user",
                parts: [{ text: systemPrompt }, { text: userPrompt }]
              }
            ],
            config: {
              responseMimeType: "application/json"
            }
          });
          break;
        } catch (error: any) {
          lastModelError = error;
          const isModelNotFound =
            error?.status === 404 ||
            String(error?.message ?? "").toLowerCase().includes("not found");
          if (!isModelNotFound) {
            throw error;
          }
        }
      }

      if (!response) {
        throw lastModelError ?? new Error("No supported Gemini model available.");
      }

      const text = extractTextFromGeminiResponse(response);
      if (!text) {
        throw new Error("Empty response from Gemini");
      }

      const parsed = parseJsonPayload(text);

      const feedback: AiFeedback = {
        summary: String(parsed.summary ?? ""),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
        redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags.map(String) : [],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems.map(String) : []
      };

      setAiCache(cacheKey, feedback);
      return feedback;
    } catch (error) {
      console.error("AI feedback generation failed:", error);
      // Fallback if AI fails
      return {
        summary:
          "AI feedback generation is temporarily unavailable. You can still use the numeric scores to understand documentation, structure, activity, impact, and organization.",
        strengths: [],
        redFlags: [],
        actionItems: []
      };
    } finally {
      aiFeedbackInFlight.delete(cacheKey);
    }
  })();

  aiFeedbackInFlight.set(cacheKey, requestPromise);
  return requestPromise;
}

