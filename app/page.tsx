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

'use client';

import { useState } from 'react';
import DeployButton from './components/DeployButton';
import DarkModeToggle from './components/DarkModeToggle';
import FileUploader from './components/FileUploader';
import Report from './components/Report';
import type { RaceReport } from '../lib/types';

export default function HomePage() {
  const [report, setReport] = useState<RaceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (formData: FormData) => {
    try {
      setLoading(true);
      setError(null);
      setReport(null);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to analyze files');
      }

      const result = (await res.json()) as RaceReport;
      setReport(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
    } finally {
      setLoading(false);
    }
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

      {error && (
        <p className="mt-4 text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-4 py-2 rounded">
          {error}
        </p>
      )}

      {report && <Report report={report} />}

      <footer className="mt-8 text-sm text-gray-400">
        Made with <span className="text-pink-400">♥</span> —{' '}
        <a
          href="https://vercel.com/new/git/external?repository-url=https://github.com/your-username/raceguard-ai&project-name=raceguard-ai"
          rel="noopener"
          target="_blank"
          className="underline text-emerald-400"
        >
          Deploy to Vercel
        </a>
      </footer>
    </main>
  );
}

