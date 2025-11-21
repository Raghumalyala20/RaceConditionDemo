import { NextResponse } from "next/server";
import { analyzeFiles } from "../../../lib/raceDetector";

export const runtime = "edge";

export async function POST(req: Request) {
  const formData = await req.formData();
  const fileEntries = formData.getAll("files");

  const files = await Promise.all(
    fileEntries.map(async (file: any) => ({
      filename: file?.name ?? "unknown",
      content: (await file?.text()) ?? "",
    }))
  );

  const result = await analyzeFiles(files);
  return NextResponse.json(result);
}

