import { PortfolioMetrics, PortfolioScore, ScoreBreakdown, ScoreBand } from "@/types/github";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeDocumentationScore(metrics: PortfolioMetrics): number {
  const { repos } = metrics;
  if (repos.length === 0) return 0;

  let score = 0;
  let reposWithReadme = 0;

  for (const r of repos) {
    if (r.readmePresent) {
      reposWithReadme += 1;
      score += 10;
      if (r.readmeLength > 300) score += 5;

      let sections = 0;
      if (r.hasInstallationSection) sections += 1;
      if (r.hasUsageSection) sections += 1;
      if (r.hasFeaturesSection) sections += 1;
      if (r.hasScreenshotsSection) sections += 1;
      score += Math.min(sections * 1.5, 6); // up to ~6 points

      if (r.hasBadges) score += 2;
    }
  }

  const maxPossible = repos.length * 23; // 10 + 5 + 6 + 2
  if (maxPossible === 0) return 0;

  const normalized = (score / maxPossible) * 20;
  return clamp(normalized, 0, 20);
}

function computeCodeStructureScore(metrics: PortfolioMetrics): number {
  const { repos } = metrics;
  if (repos.length === 0) return 0;

  let score = 0;
  let considered = 0;

  for (const r of repos) {
    // very small or archived repos are ignored
    if (r.repo.size < 50 || r.repo.archived || r.repo.disabled) continue;
    considered += 1;

    const name = r.repo.name.toLowerCase();
    if (!name.startsWith("test-") && !name.startsWith("playground")) {
      score += 3; // meaningful name
    }

    // heuristics based on topics, description, etc. (best-effort without full tree)
    if (r.repo.description && r.repo.description.length > 40) {
      score += 2;
    }

    // reward structured, modern stacks by keywords
    const text = (r.repo.description ?? "").toLowerCase();
    if (
      text.includes("next.js") ||
      text.includes("react") ||
      text.includes("node") ||
      text.includes("express") ||
      text.includes("django") ||
      text.includes("fastapi") ||
      text.includes("nest") ||
      text.includes("kubernetes") ||
      text.includes("microservice")
    ) {
      score += 3;
    }
  }

  if (considered === 0) return 0;
  const maxPossible = considered * 8;
  const normalized = (score / maxPossible) * 20;
  return clamp(normalized, 0, 20);
}

function computeActivityScore(metrics: PortfolioMetrics): number {
  const { repos, totalCommits90d } = metrics;
  if (repos.length === 0) return 0;

  let recentTouchCount = 0;
  const now = new Date();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(now.getDate() - 90);

  for (const r of repos) {
    if (!r.lastCommitDate) continue;
    const d = new Date(r.lastCommitDate);
    if (d >= ninetyDaysAgo) {
      recentTouchCount += 1;
    }
  }

  let score = 0;

  // base on total commits
  if (totalCommits90d === 0) {
    score = 0;
  } else if (totalCommits90d < 20) {
    score = 6;
  } else if (totalCommits90d < 60) {
    score = 10;
  } else if (totalCommits90d < 150) {
    score = 15;
  } else {
    score = 18;
  }

  // reward consistency across multiple repos
  if (recentTouchCount >= 3) score += 2;

  return clamp(score, 0, 20);
}

function computeTechnicalDepthScore(metrics: PortfolioMetrics): number {
  const { repos } = metrics;
  if (repos.length === 0) return 0;

  const languages = new Set<string>();
  let largeProjects = 0;
  let advancedStacks = 0;

  for (const r of repos) {
    if (r.repo.archived || r.repo.disabled) continue;
    if (r.repo.language) languages.add(r.repo.language);
    if (r.repo.size > 1000) largeProjects += 1;

    const text = (r.repo.description ?? "").toLowerCase();
    if (
      text.includes("machine learning") ||
      text.includes("deep learning") ||
      text.includes("ai") ||
      text.includes("llm") ||
      text.includes("graphql") ||
      text.includes("kubernetes") ||
      text.includes("docker") ||
      text.includes("cloud") ||
      text.includes("aws") ||
      text.includes("gcp") ||
      text.includes("azure") ||
      text.includes("microservice")
    ) {
      advancedStacks += 1;
    }
  }

  let score = 0;

  if (languages.size >= 1) score += 4;
  if (languages.size >= 3) score += 3;
  if (largeProjects >= 1) score += 4;
  if (largeProjects >= 3) score += 2;
  if (advancedStacks >= 1) score += 2;
  if (advancedStacks >= 3) score += 2;

  return clamp(score, 0, 15);
}

function computeImpactScore(metrics: PortfolioMetrics): number {
  const { repos } = metrics;
  if (repos.length === 0) return 0;

  let totalStars = 0;
  let totalForks = 0;
  let totalIssues = 0;

  for (const r of repos) {
    totalStars += r.repo.stargazers_count;
    totalForks += r.repo.forks_count;
    totalIssues += r.repo.open_issues_count;
  }

  let score = 0;

  if (totalStars > 0) score += 4;
  if (totalStars > 10) score += 3;
  if (totalStars > 50) score += 3;

  if (totalForks > 0) score += 2;
  if (totalForks > 10) score += 2;

  // Cap penalty for lots of unresolved issues.
  if (totalIssues > 20) {
    score -= 2;
  }

  return clamp(score, 0, 15);
}

function computeOrganizationScore(metrics: PortfolioMetrics): number {
  const { repos, pinnedRepos } = metrics;
  if (repos.length === 0) return 0;

  let score = 0;

  if (pinnedRepos.length >= 1) score += 4;
  if (pinnedRepos.length >= 3) score += 2;

  const completeRepos = repos.filter(
    (r) => r.readmePresent && !r.repo.archived && !r.repo.disabled
  );
  if (completeRepos.length >= 3) score += 3;
  if (completeRepos.length >= 5) score += 1;

  const archivedJunk = repos.filter(
    (r) => r.repo.archived && r.repo.size < 50
  ).length;
  if (archivedJunk >= 3) score += 2; // reward cleaning up junk into archived

  return clamp(score, 0, 10);
}

function getBand(total: number): ScoreBand {
  if (total >= 85) return "Recruiter Ready";
  if (total >= 70) return "Strong but Improvable";
  if (total >= 50) return "Needs Optimization";
  return "Major Improvements Needed";
}

export function computePortfolioScore(metrics: PortfolioMetrics): PortfolioScore {
  const breakdown: ScoreBreakdown = {
    documentation: computeDocumentationScore(metrics),
    codeStructure: computeCodeStructureScore(metrics),
    activity: computeActivityScore(metrics),
    technicalDepth: computeTechnicalDepthScore(metrics),
    impact: computeImpactScore(metrics),
    organization: computeOrganizationScore(metrics)
  };

  const totalRaw =
    breakdown.documentation +
    breakdown.codeStructure +
    breakdown.activity +
    breakdown.technicalDepth +
    breakdown.impact +
    breakdown.organization;

  // Each breakdown is already normalized to its max; sum is 100.
  const total = clamp(Math.round(totalRaw), 0, 100);

  return {
    total,
    breakdown,
    band: getBand(total)
  };
}

