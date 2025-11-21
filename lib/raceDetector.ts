import type { RaceReport, UploadedFile } from "./types";

export async function analyzeFiles(files: UploadedFile[]): Promise<RaceReport> {
  const issues = [];

  for (const { filename, content } of files) {
    if (filename.endsWith(".java")) {
      if (/static\s+[a-zA-Z_][\w]*\s*=/.test(content) && !/@GuardedBy|synchronized/.test(content)) {
        issues.push({
          filename,
          kind: "Java static cache",
          problem: "Detected static cache without synchronization",
          suggestion: 'Wrap access using synchronized or @GuardedBy("class")',
        });
      }
      if (/@Async/.test(content)) {
        issues.push({
          filename,
          kind: "@Async",
          problem: "Usage of @Async may cause race if not protected by locking",
          suggestion: "Add proper locking or consider alternate async abstraction",
        });
      }
    }

    if (filename.endsWith(".sql") || filename.endsWith(".yml")) {
      if (/insert\s+into\s+\S+\s*\(([^)]+)\)/i.test(content) && !/unique/i.test(content)) {
        issues.push({
          filename,
          kind: "SQL INSERT",
          problem: "Insert statement without UNIQUE constraint detected",
          suggestion: "Add UNIQUE constraint to critical columns to avoid race",
        });
      }
      if (/select.*from\s+\S+/i.test(content) && !/for update/i.test(content)) {
        issues.push({
          filename,
          kind: "SQL SELECT",
          problem: "SELECT statement may miss locking (no FOR UPDATE found)",
          suggestion: "Add FOR UPDATE to SELECT to ensure row-level locking",
        });
      }
    }
  }

  const summary =
    issues.length === 0
      ? "No obvious race conditions detected."
      : `Detected ${issues.length} possible race condition${issues.length > 1 ? "s" : ""}.`;

  return {
    issues,
    summary,
    suggestions: [...issues.map((i) => i.suggestion), "Consider using MERGE statements and cap_group for batch upserts."],
  };
}

