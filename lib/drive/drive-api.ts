import { driveFetch } from "./client";
import { getExtension } from "./filename";
import { FOLDER_MIME_TYPE, mimeTypeForExtension } from "./mime";
import type { DriveFile } from "./types";

function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

interface FileListResponse {
  files?: DriveFile[];
}

export async function initVfs(
  token: string,
  folderName: string,
): Promise<string> {
  const query = [
    `mimeType='${FOLDER_MIME_TYPE}'`,
    `name='${escapeQueryValue(folderName)}'`,
    "trashed=false",
  ].join(" and ");

  const search = await driveFetch(
    `/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    token,
  );
  const found = (await search.json()) as FileListResponse;

  if (found.files && found.files.length > 0) {
    return found.files[0].id;
  }

  const created = await driveFetch("/drive/v3/files?fields=id", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: folderName, mimeType: FOLDER_MIME_TYPE }),
  });
  const folder = (await created.json()) as { id: string };
  return folder.id;
}

export async function listFiles(
  token: string,
  folderId: string,
): Promise<DriveFile[]> {
  const query = `'${escapeQueryValue(folderId)}' in parents and trashed=false`;
  const response = await driveFetch(
    `/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime)&orderBy=name`,
    token,
  );
  const data = (await response.json()) as FileListResponse;
  return data.files ?? [];
}

export async function readFile(token: string, fileId: string): Promise<string> {
  const response = await driveFetch(
    `/drive/v3/files/${fileId}?alt=media`,
    token,
  );
  return response.text();
}

export async function createFile(
  token: string,
  folderId: string,
  name: string,
  content: string,
): Promise<DriveFile> {
  const extension = getExtension(name) ?? "txt";
  const mimeType = mimeTypeForExtension(extension);
  const boundary = `proxy-terminal-${Date.now()}`;
  const metadata = { name, parents: [folderId], mimeType };

  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${mimeType}; charset=UTF-8`,
    "",
    content,
    `--${boundary}--`,
    "",
  ].join("\r\n");

  const response = await driveFetch(
    "/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType",
    token,
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    },
  );
  return (await response.json()) as DriveFile;
}

export async function writeFile(
  token: string,
  fileId: string,
  content: string,
): Promise<void> {
  await driveFetch(
    `/upload/drive/v3/files/${fileId}?uploadType=media`,
    token,
    {
      method: "PATCH",
      headers: { "Content-Type": "text/plain; charset=UTF-8" },
      body: content,
    },
  );
}

export async function deleteFile(
  token: string,
  fileId: string,
): Promise<void> {
  await driveFetch(`/drive/v3/files/${fileId}`, token, { method: "DELETE" });
}
