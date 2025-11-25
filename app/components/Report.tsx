"use client";

import jsPDF from "jspdf";
import type { RaceReport, Severity } from "../../lib/types";

type Props = {
  report: RaceReport;
};

const severityCopy: Record<
  Severity,
  { label: string; badge: string; dot: string }
> = {
  high: {
    label: "High",
    badge: "bg-red-500/20 text-red-300 border border-red-500/50",
    dot: "text-red-400",
  },
  medium: {
    label: "Medium",
    badge: "bg-amber-500/20 text-amber-200 border border-amber-500/50",
    dot: "text-amber-300",
  },
  low: {
    label: "Low",
    badge: "bg-sky-500/20 text-sky-200 border border-sky-500/50",
    dot: "text-sky-300",
  },
};

export default function Report({ report }: Props) {
  const handleDownload = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("RaceGuard Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Summary: ${report.summary}`, 14, 38);
    doc.text(`Scanned files: ${report.scannedFiles}`, 14, 46);
    doc.text(
      `Severity totals - High: ${report.severityTotals.high}, Medium: ${report.severityTotals.medium}, Low: ${report.severityTotals.low}`,
      14,
      54
    );

    let y = 66;
    const margin = 14;
    report.issues.forEach((issue, idx) => {
      const block = `[${severityCopy[issue.severity].label}] ${issue.filename} · ${issue.kind}\n${issue.problem}\nSuggestion: ${issue.suggestion}`;
      const lines = doc.splitTextToSize(block, 180);
      if (y + lines.length * 6 > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(lines, margin, y);
      y += lines.length * 6 + 4;
      if (idx < report.issues.length - 1) {
        doc.setDrawColor(70);
        doc.line(margin, y - 2, 196, y - 2);
        y += 4;
      }
    });

    if (report.issues.length === 0) {
      doc.text("No issues detected.", margin, y);
    }

    doc.save("raceguard-report.pdf");
  };

  return (
    <div className="mt-8 max-w-4xl w-full bg-gray-800 p-8 rounded shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-emerald-400">RaceGuard Report</h2>
          <p className="text-sm text-gray-300">{report.summary}</p>
          <p className="text-xs text-gray-500">
            {report.scannedFiles} file{report.scannedFiles === 1 ? "" : "s"} analyzed
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          className="self-start md:self-auto px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white shadow"
        >
          Download PDF
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        {(Object.keys(severityCopy) as Severity[]).map((level) => (
          <div
            key={level}
            className="flex items-center gap-2 rounded border border-gray-700 px-3 py-2 text-sm"
          >
            <span className={`${severityCopy[level].dot}`}>●</span>
            <span className="font-medium">{severityCopy[level].label}</span>
            <span className="text-gray-300">
              {report.severityTotals[level]} finding
              {report.severityTotals[level] === 1 ? "" : "s"}
            </span>
          </div>
        ))}
      </div>

      {report.issues.length > 0 && (
        <div className="overflow-auto">
          <table className="table-auto w-full text-sm mb-4">
            <thead>
              <tr className="text-left text-gray-400">
                <th className="py-2">Severity</th>
                <th className="py-2">File</th>
                <th className="py-2">Type</th>
                <th className="py-2">Issue</th>
                <th className="py-2">Suggestion</th>
              </tr>
            </thead>
            <tbody>
              {report.issues.map((issue, idx) => (
                <tr key={issue.filename + idx} className="border-t border-gray-700">
                  <td className="py-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${severityCopy[issue.severity].badge}`}
                    >
                      {severityCopy[issue.severity].label}
                    </span>
                  </td>
                  <td className="py-2">{issue.filename}</td>
                  <td className="py-2">{issue.kind}</td>
                  <td className="py-2 text-pink-400">{issue.problem}</td>
                  <td className="py-2 text-emerald-400">{issue.suggestion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ul className="list-disc list-inside pl-2 space-y-1 text-sm text-gray-200">
        {report.suggestions.map((s, idx) => (
          <li key={idx}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

