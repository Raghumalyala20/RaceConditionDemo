"use client";

import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", enabled);
  }, [enabled]);

  return (
    <button
      aria-label="Toggle dark mode"
      className="px-3 py-1 text-xs rounded bg-gray-700 text-gray-200 hover:bg-gray-600 transition shadow"
      onClick={() => setEnabled((prev) => !prev)}
    >
      {enabled ? "🌚" : "🌞"}
    </button>
  );
}

