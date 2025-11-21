"use client";

import { useRef } from "react";

type Props = {
  onAnalyze: (formData: FormData) => void | Promise<void>;
  loading: boolean;
};

export default function FileUploader({ onAnalyze, loading }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const files = fileInput.current?.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i += 1) {
      formData.append("files", files[i]);
    }

    void onAnalyze(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 rounded p-6 w-full max-w-xl shadow flex flex-col items-center"
    >
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
        className="px-6 py-2 rounded bg-emerald-600 hover:bg-emerald-700 font-semibold text-white flex items-center disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Analyzing…" : "Analyze Files"}
      </button>
    </form>
  );
}

