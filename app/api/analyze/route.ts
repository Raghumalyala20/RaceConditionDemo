import { NextResponse } from "next/server";
import JSZip from "jszip";
import { analyzeFiles } from "../../../lib/raceDetector";
import { fetchGithubRepoFiles } from "../../../lib/github";
import type { UploadedFile } from "../../../lib/types";

const SUPPORTED_EXT = /\.(java|sql|ya?ml|ts|tsx|js|jsx)$/i;

export const runtime = "edge";

export async function POST(req: Request) {
  const formData = await req.formData();
  const fileEntries = formData.getAll("files");
  const repoUrl = formData.get("repoUrl");

  const collected: UploadedFile[] = [];

  for (const entry of fileEntries) {
    const file = entry as any;
    if (!file) continue;

    const name = file.name ?? "unknown";

    if (name.toLowerCase().endsWith(".zip")) {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      const zipFiles = Object.values(zip.files).filter(
        (zf) => !zf.dir && SUPPORTED_EXT.test(zf.name)
      );

      for (const zf of zipFiles) {
        const content = await zf.async("string");
        collected.push({
          filename: zf.name,
          content,
        });
      }
    } else if (SUPPORTED_EXT.test(name)) {
      const content = await file.text();
      collected.push({
        filename: name,
        content,
      });
    }
  }

  if (typeof repoUrl === "string" && repoUrl.trim()) {
    const repoFiles = await fetchGithubRepoFiles(repoUrl.trim());
    collected.push(...repoFiles);
  }

  const result = await analyzeFiles(collected);
  return NextResponse.json(result);
}

