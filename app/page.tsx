/*
RaceGuard AI v1 - Main Entry Point & App Explanation

You are viewing the main entrypoint for RaceGuard AI v1. Other files are referenced in comments.
This is a multi-file Next.js 15 fullstack app with backend race detector, multi-file upload, beautiful report and Vercel deploy.

----------------------------
Structure Overview:
----------------------------
/app
  /page.tsx          <-- Next.js 15 page, contains UI and client logic
  /api/analyze/route.ts <-- Next.js Route handler, receives uploads and dispatches static/race detection
/components
  /FileUploader.tsx    <-- Multi-file uploader
  /Report.tsx          <-- Beautiful race result report
  /DarkModeToggle.tsx  <-- Dark mode toggle
  /DeployButton.tsx    <-- Instant Vercel deployment
/lib
  /raceDetector.ts     <-- Race condition analysis logic
/tailwind.config.cjs   <-- Tailwind config
/vercel.json           <-- Vercel config
/package.json, tsconfig.json, etc.

-------------------------------
To deploy, upload to Vercel. To run locally:
  npm install
  npm run dev

-------------------------------
*/

// -- MainPage: app/page.tsx --
"use client";
import FileUploader from '../components/FileUploader';
import Report from '../components/Report';
import DarkModeToggle from '../components/DarkModeToggle';
import DeployButton from '../components/DeployButton';
import { useState } from 'react';

export default function HomePage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (formData: FormData) => {
    setLoading(true);
    setReport(null);

    const res = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    setReport(result);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center py-12 transition-colors duration-300">
      <div className="flex flex-row justify-between w-full max-w-4xl mb-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-pink-500 bg-clip-text text-transparent drop-shadow">
          RaceGuard AI v1 – Race Condition Detector
        </h1>
        <div className="flex items-center space-x-2">
          <DeployButton />
          <DarkModeToggle />
        </div>
      </div>
      <FileUploader onAnalyze={handleAnalyze} loading={loading} />
      {report && <Report report={report} />}
      <footer className="mt-8 text-sm text-gray-400">
        Made with <span className="text-pink-400">♥</span> —{' '}
        <a href="https://vercel.com/new/git/external?repository-url=https://github.com/your-username/raceguard-ai&project-name=raceguard-ai" rel="noopener" target="_blank" className="underline text-emerald-400">Deploy to Vercel</a>
      </footer>
    </main>
  );
}

// -- FileUploader component: components/FileUploader.tsx --
"use client";
import { useRef } from 'react';
type Props = {
  onAnalyze: (formData: FormData) => void;
  loading: boolean;
};

export default function FileUploader({ onAnalyze, loading }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const files = fileInput.current?.files;
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; ++i) {
      formData.append('files', files[i]);
    }
    onAnalyze(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded p-6 w-full max-w-xl shadow flex flex-col items-center">
      <input
        ref={fileInput}
        type="file"
        name="files"
        multiple
        accept=".java,.sql,.yml"
        className="block w-full mb-4 text-sm text-gray-200 file:bg-emerald-500 file:text-white file:rounded file:p-2"
        required
        disabled={loading}
      />
      <button
        type="submit"
        className={`px-6 py-2 rounded bg-emerald-600 hover:bg-emerald-700 font-semibold text-white flex items-center disabled:opacity-50`}
        disabled={loading}
      >{loading ? "Analyzing…" : "Analyze Files"}</button>
    </form>
  );
}

// -- API Route: app/api/analyze/route.ts --
import { NextRequest, NextResponse } from "next/server";
import { analyzeFiles } from "../../../lib/raceDetector";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  // Get the uploaded files as Array<Blob>
  const fileEntries = formData.getAll('files');

  const files = await Promise.all(fileEntries.map(async (f: any) => ({
    filename: f.name,
    content: await f.text()
  })));

  const result = await analyzeFiles(files); // See lib/raceDetector.ts
  return NextResponse.json(result);
}

// -- Race Detector: lib/raceDetector.ts --
type UploadedFile = { filename: string, content: string };

export async function analyzeFiles(files: UploadedFile[]) {
  const issues: any[] = [];

  for (const { filename, content } of files) {
    // Java: Find missing synchronized, static caches, @Async, etc
    if (filename.endsWith(".java")) {
      if (/static\s+[a-zA-Z_][\w]*\s*=/.test(content) && !/@GuardedBy|synchronized/.test(content)) {
        issues.push({
          filename,
          kind: "Java static cache",
          problem: "Detected static cache without synchronization",
          suggestion: "Wrap access using synchronized or @GuardedBy(\"class\")"
        });
      }
      if (/@Async/.test(content)) {
        issues.push({
          filename,
          kind: "@Async",
          problem: "Usage of @Async may cause race if not protected by locking",
          suggestion: "Add proper locking or consider alternate async abstraction"
        });
      }
    }

    // SQL: Find no UNIQUE, no FOR UPDATE
    if (filename.endsWith(".sql") || filename.endsWith(".yml")) {
      if (/insert\s+into\s+\S+\s*\(([^)]+)\)/i.test(content) && !/unique/i.test(content)) {
        issues.push({
          filename,
          kind: "SQL INSERT",
          problem: "Insert statement without UNIQUE constraint detected",
          suggestion: "Add UNIQUE constraint to critical columns to avoid race"
        });
      }
      if (/select.*from\s+\S+/i.test(content) && !/for update/i.test(content)) {
        issues.push({
          filename,
          kind: "SQL SELECT",
          problem: "SELECT statement may miss locking (no FOR UPDATE found)",
          suggestion: "Add FOR UPDATE to SELECT to ensure row-level locking"
        });
      }
    }
  }

  return {
    issues,
    summary: issues.length === 0
      ? "No obvious race conditions detected."
      : `Detected ${issues.length} possible race condition${issues.length > 1 ? 's' : ''}.`,
    suggestions: [
      ...issues.map(i => i.suggestion),
      "Consider using MERGE statements and cap_group for batch upserts."
    ],
  };
}

// -- Report component: components/Report.tsx --
"use client";
type Props = { report: any };

export default function Report({ report }: Props) {
  return (
    <div className="mt-8 max-w-xl w-full bg-gray-800 p-8 rounded shadow">
      <h2 className="text-xl font-bold text-emerald-400 mb-4">RaceGuard Report</h2>
      <div className="mb-2 font-semibold">
        {report.summary}
      </div>
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
            {report.issues.map((issue: any, idx: number) => (
              <tr key={idx} className="border-t border-gray-700">
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
        {report.suggestions.map((s: string, idx: number) => (
          <li key={idx}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

// -- Dark mode toggle (client side): components/DarkModeToggle.tsx --
"use client";
import { useEffect, useState } from "react";
export default function DarkModeToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', enabled);
  }, [enabled]);

  return (
    <button
      aria-label="Toggle dark mode"
      className="px-3 py-1 text-xs rounded bg-gray-700 text-gray-200 hover:bg-gray-600 transition shadow"
      onClick={() => setEnabled(e => !e)}
    >
      {enabled ? "🌚" : "🌞"}
    </button>
  );
}

// -- Deploy Button: components/DeployButton.tsx --
"use client";
export default function DeployButton() {
  return (
    <a href="https://vercel.com/new/git/external?repository-url=https://github.com/your-username/raceguard-ai&project-name=raceguard-ai"
      target="_blank"
      rel="noopener"
      className="inline-flex items-center px-3 py-1 rounded bg-emerald-500 text-white text-xs font-semibold shadow hover:bg-emerald-600">
      ▲ Deploy to Vercel
    </a>
  );
}

// -- tailwind.config.cjs --
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", 
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

// -- vercel.json --
{
  "rewrites": [{ "source": "/api/(.*)", "destination": "/api/$1" }]
}

// -- README.md (snippet) --
/*
# RaceGuard AI v1

Run locally:
  npm install
  npm run dev

Deploy now:
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/your-username/raceguard-ai&project-name=raceguard-ai)
*/

