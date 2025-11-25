import type { UploadedFile } from "./types";

const TRACKED_EXT = /\.(java|sql|ya?ml|ts|tsx|js|jsx)$/i;

function normalizeGithubUrl(input: string): { owner: string; repo: string } | null {
  try {
    const url = new URL(input.replace(/\.git$/, ""));
    if (url.hostname !== "github.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const [owner, repo] = parts;
    return { owner, repo };
  } catch {
    return null;
  }
}

async function fetchTree(
  owner: string,
  repo: string,
  branch: string
): Promise<{ path: string; type: string }[] | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { tree?: { path: string; type: string }[] };
  return json.tree ?? null;
}

export async function fetchGithubRepoFiles(repoUrl: string): Promise<UploadedFile[]> {
  const info = normalizeGithubUrl(repoUrl);
  if (!info) return [];

  const { owner, repo } = info;
  const branches = ["main", "master"];
  let tree: { path: string; type: string }[] | null = null;
  let usedBranch: string | null = null;

  for (const branch of branches) {
    tree = await fetchTree(owner, repo, branch);
    if (tree) {
      usedBranch = branch;
      break;
    }
  }

  if (!tree || !usedBranch) return [];

  const interesting = tree.filter(
    (entry) => entry.type === "blob" && TRACKED_EXT.test(entry.path)
  );

  const files: UploadedFile[] = [];

  for (const entry of interesting) {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${usedBranch}/${entry.path}`;
    const res = await fetch(rawUrl);
    if (!res.ok) continue;
    const content = await res.text();
    files.push({
      filename: entry.path,
      content,
    });
  }

  return files;
}


