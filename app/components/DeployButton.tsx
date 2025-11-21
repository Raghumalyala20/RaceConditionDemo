"use client";

export default function DeployButton() {
  return (
    <a
      href="https://vercel.com/new/git/external?repository-url=https://github.com/your-username/raceguard-ai&project-name=raceguard-ai"
      target="_blank"
      rel="noopener"
      className="inline-flex items-center px-3 py-1 rounded bg-emerald-500 text-white text-xs font-semibold shadow hover:bg-emerald-600"
    >
      ▲ Deploy to Vercel
    </a>
  );
}

