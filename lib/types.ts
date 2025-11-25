export type UploadedFile = {
  filename: string;
  content: string;
};

export type Severity = "low" | "medium" | "high";

export type RaceIssue = {
  filename: string;
  kind: string;
  problem: string;
  suggestion: string;
  severity: Severity;
};

export type SeverityTotals = Record<Severity, number>;

export type RaceReport = {
  issues: RaceIssue[];
  summary: string;
  suggestions: string[];
  severityTotals: SeverityTotals;
  scannedFiles: number;
};

