export type UploadedFile = {
  filename: string;
  content: string;
};

export type RaceIssue = {
  filename: string;
  kind: string;
  problem: string;
  suggestion: string;
};

export type RaceReport = {
  issues: RaceIssue[];
  summary: string;
  suggestions: string[];
};

