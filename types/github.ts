export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  followers: number;
  public_repos: number;
  bio: string | null;
  company: string | null;
  location: string | null;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics?: string[];
  archived: boolean;
  disabled: boolean;
  size: number;
  default_branch: string;
  created_at: string;
  updated_at: string;
}

export interface PinnedRepository {
  name: string;
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: {
    name: string;
  } | null;
  url: string;
}

export interface RepoAnalysis {
  repo: GitHubRepository;
  readmePresent: boolean;
  readmeLength: number;
  hasInstallationSection: boolean;
  hasUsageSection: boolean;
  hasFeaturesSection: boolean;
  hasScreenshotsSection: boolean;
  hasBadges: boolean;
  commitCount90d: number;
  lastCommitDate: string | null;
  languages: string[];
}

export interface PortfolioMetrics {
  user: GitHubUser;
  repos: RepoAnalysis[];
  pinnedRepos: PinnedRepository[];
  totalCommits90d: number;
  activeMonthsCount: number;
}

export type ScoreBand =
  | "Recruiter Ready"
  | "Strong but Improvable"
  | "Needs Optimization"
  | "Major Improvements Needed";

export interface ScoreBreakdown {
  documentation: number;
  codeStructure: number;
  activity: number;
  technicalDepth: number;
  impact: number;
  organization: number;
}

export interface PortfolioScore {
  total: number;
  breakdown: ScoreBreakdown;
  band: ScoreBand;
}

export interface AiFeedback {
  summary: string;
  strengths: string[];
  redFlags: string[];
  actionItems: string[];
}

