"use client";

import { useRef, useState } from "react";

type Props = {
  onAnalyze: (formData: FormData) => void | Promise<void>;
  loading: boolean;
};

export default function FileUploader({ onAnalyze, loading }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [repoUrl, setRepoUrl] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const files = fileInput.current?.files;
    const trimmedUrl = repoUrl.trim();

    if ((!files || files.length === 0) && !trimmedUrl) {
      return;
    }

    const formData = new FormData();

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i += 1) {
        formData.append("files", files[i]);
      }
    }

    if (trimmedUrl) {
      formData.append("repoUrl", trimmedUrl);
    }

    void onAnalyze(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 rounded p-6 w-full max-w-xl shadow flex flex-col items-center space-y-4"
    >
      <div className="w-full">
        <label className="block text-sm font-medium mb-1">
          Upload files or repo ZIP (.java, .ts/.tsx, .js/.jsx, .sql, .yml/.yaml, .zip)
        </label>
        <input
          ref={fileInput}
          type="file"
          name="files"
          multiple
          accept=".java,.ts,.tsx,.js,.jsx,.sql,.yml,.yaml,.zip"
          className="block w-full text-sm text-gray-200 file:bg-emerald-500 file:text-white file:rounded file:p-2"
          disabled={loading}
        />
      </div>

      <div className="w-full">
        <label className="block text-sm font-medium mb-1">
          Or analyze a public GitHub repo URL
        </label>
        <input
          type="url"
          name="repoUrl"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/user/repo"
          className="w-full rounded bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-400">
          Only public GitHub repositories are supported.
        </p>
      </div>

      <button
        type="submit"
        className="px-6 py-2 rounded bg-emerald-600 hover:bg-emerald-700 font-semibold text-white flex items-center disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Analyzing…" : "Analyze"}
      </button>
    </form>
  );
}

