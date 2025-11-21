"use client";

import type { RaceReport } from "../../lib/types";

type Props = {
  report: RaceReport;
};

export default function Report({ report }: Props) {
  return (
    <div className="mt-8 max-w-xl w-full bg-gray-800 p-8 rounded shadow">
      <h2 className="text-xl font-bold text-emerald-400 mb-4">RaceGuard Report</h2>
      <div className="mb-2 font-semibold">{report.summary}</div>

      {report.issues.length > 0 && (
        <table className="table-auto w-full text-sm mb-4">
          <thead>
            <tr>
              <th className="text-left py-2">File</th>
              <th className="text-left py-2">Type</th>
              <th className="text-left py-2">Issue</th>
              <th className="text-left py-2">Suggestion</th>
            </tr>
          </thead>
          <tbody>
            {report.issues.map((issue, idx) => (
              <tr key={issue.filename + idx} className="border-t border-gray-700">
                <td className="py-1">{issue.filename}</td>
                <td className="py-1">{issue.kind}</td>
                <td className="py-1 text-pink-400">{issue.problem}</td>
                <td className="py-1 text-emerald-400">{issue.suggestion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ul className="list-disc list-inside pl-2 space-y-1">
        {report.suggestions.map((s, idx) => (
          <li key={idx}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

