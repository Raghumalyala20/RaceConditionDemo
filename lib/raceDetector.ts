import type {
  RaceIssue,
  RaceReport,
  Severity,
  SeverityTotals,
  UploadedFile,
} from "./types";

type Rule = (filename: string, content: string) => RaceIssue | RaceIssue[] | null;

const TRACKED_FRONTEND = /\.(ts|tsx|js|jsx)$/i;
const TRACKED_SQL = /\.(sql|ya?ml)$/i;

const javaRules: Rule[] = [
  (filename, content) => {
    const hasStatic =
      /static\s+(?!final)[A-Za-z0-9_<>\[\]]+\s+[A-Za-z0-9_]+\s*=/.test(content);
    const hasGuard = /@GuardedBy|synchronized/.test(content);
    if (hasStatic && !hasGuard) {
      return {
        filename,
        kind: "Java static cache",
        problem: "Detected static mutable field without synchronization",
        suggestion: 'Wrap access using synchronized blocks or @GuardedBy("class")',
        severity: "high",
      };
    }
    return null;
  },
  (filename, content) => {
    if (/@Async/.test(content)) {
      return {
        filename,
        kind: "@Async usage",
        problem: "Async method execution may run concurrently without protection",
        suggestion: "Guard async methods with locks or move work onto managed queues",
        severity: "medium",
      };
    }
    return null;
  },
  (filename, content) => {
    if (/static\s+SimpleDateFormat/.test(content)) {
      return {
        filename,
        kind: "SimpleDateFormat",
        problem: "SimpleDateFormat is not thread-safe and is cached statically",
        suggestion: "Use ThreadLocal<SimpleDateFormat> or java.time formatters",
        severity: "high",
      };
    }
    return null;
  },
  (filename, content) => {
    const createsExecutor = /Executors\.new(?:Fixed|Cached|Scheduled|WorkStealing)ThreadPool/.test(
      content
    );
    if (createsExecutor && !/\.shutdown\s*\(/.test(content)) {
      return {
        filename,
        kind: "ExecutorService lifecycle",
        problem: "Thread pool created without a corresponding shutdown/await termination",
        suggestion: "Call shutdown() or manage the pool via application lifecycle hooks",
        severity: "medium",
      };
    }
    return null;
  },
];

const sqlRules: Rule[] = [
  (filename, content) => {
    if (/insert\s+into\s+\S+\s*\(([^)]+)\)/i.test(content) && !/unique/i.test(content)) {
      return {
        filename,
        kind: "SQL INSERT",
        problem: "Insert statement without UNIQUE/UPSERT guard detected",
        suggestion: "Add UNIQUE constraints or use UPSERT/MERGE to avoid duplicates",
        severity: "medium",
      };
    }
    return null;
  },
  (filename, content) => {
    if (/select\s+.*from\s+\S+/i.test(content) && !/for\s+update/i.test(content)) {
      return {
        filename,
        kind: "SQL SELECT",
        problem: "Select statement missing FOR UPDATE locking on critical tables",
        suggestion: "Add FOR UPDATE or other locking hints to serialize writers",
        severity: "medium",
      };
    }
    return null;
  },
  (filename, content) => {
    const mutating = /(update\s+\S+\s+set|delete\s+from\s+\S+)/i.test(content);
    const transactional = /(begin|start)\s+transaction|commit/i.test(content);
    if (mutating && !transactional) {
      return {
        filename,
        kind: "Transaction scope",
        problem: "Data mutation without explicit transaction boundaries",
        suggestion: "Wrap mutating statements inside BEGIN/COMMIT or use ORM transactions",
        severity: "high",
      };
    }
    return null;
  },
  (filename, content) => {
    if (/with\s*\(\s*nolock\s*\)/i.test(content)) {
      return {
        filename,
        kind: "NOLOCK hint",
        problem: "Query uses NOLOCK which allows dirty reads and race conditions",
        suggestion: "Remove NOLOCK or switch to snapshot isolation",
        severity: "high",
      };
    }
    return null;
  },
];

const frontendRules: Rule[] = [
  (filename, content) => {
    if (/document\.(querySelector|getElementById|addEventListener)|window\.addEventListener/.test(content)) {
      return {
        filename,
        kind: "Direct DOM manipulation",
        problem: "Direct DOM access inside React component can desync state",
        suggestion: "Use refs/effects to coordinate DOM mutations or rely on React state",
        severity: "medium",
      };
    }
    return null;
  },
  (filename, content) => {
    const timers = /(setTimeout|setInterval)\(/.test(content);
    const cleanup = /(clearTimeout|clearInterval)/.test(content);
    if (timers && !cleanup) {
      return {
        filename,
        kind: "Timers without cleanup",
        problem: "setTimeout/setInterval created without clear*, risking dangling work",
        suggestion: "Return a cleanup function from effects that clears timers",
        severity: "low",
      };
    }
    return null;
  },
  (filename, content) => {
    if (/(^|\n)\s*(let|var)\s+[A-Za-z0-9_]+\s*=\s*(\{|\[)/.test(content)) {
      return {
        filename,
        kind: "Shared mutable module state",
        problem: "Top-level mutable objects may be shared across requests/renders",
        suggestion: "Move mutable state inside hooks or wrap access with state managers",
        severity: "medium",
      };
    }
    return null;
  },
];

function applyRules(rules: Rule[], filename: string, content: string): RaceIssue[] {
  const matches: RaceIssue[] = [];
  for (const rule of rules) {
    const result = rule(filename, content);
    if (!result) continue;
    if (Array.isArray(result)) {
      matches.push(...result);
    } else {
      matches.push(result);
    }
  }
  return matches;
}

function initializeTotals(): SeverityTotals {
  return { low: 0, medium: 0, high: 0 };
}

export async function analyzeFiles(files: UploadedFile[]): Promise<RaceReport> {
  const issues: RaceIssue[] = [];
  const suggestions = new Set<string>();

  for (const { filename, content } of files) {
    const lower = filename.toLowerCase();

    if (lower.endsWith(".java")) {
      issues.push(...applyRules(javaRules, filename, content));
    } else if (TRACKED_SQL.test(lower)) {
      issues.push(...applyRules(sqlRules, filename, content));
    } else if (TRACKED_FRONTEND.test(lower)) {
      issues.push(...applyRules(frontendRules, filename, content));
    }
  }

  issues.forEach((issue) => suggestions.add(issue.suggestion));
  suggestions.add("Consider using MERGE/UPSERT patterns for shared writes.");
  suggestions.add("Add request-level locking or queueing for high-contention code paths.");

  const severityTotals = issues.reduce<SeverityTotals>((acc, issue) => {
    acc[issue.severity] += 1;
    return acc;
  }, initializeTotals());

  const total = issues.length;
  const summary =
    total === 0
      ? "No obvious race conditions detected."
      : `Detected ${total} potential issue${total === 1 ? "" : "s"} (${severityTotals.high} high, ${severityTotals.medium} medium, ${severityTotals.low} low).`;

  return {
    issues,
    summary,
    suggestions: Array.from(suggestions),
    severityTotals,
    scannedFiles: files.length,
  };
}

