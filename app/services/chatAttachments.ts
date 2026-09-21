// Attachments for the Modus agent composer.
//
// The picking, validating and previewing below is real and final. What is NOT wired is the
// transport: the chat API is text-only today (see app/types/chat.ts — both ask endpoints take
// a `query` string and nothing else, and no CAM backend has been chosen yet), so there is
// nowhere to PUT the bytes. `uploadAttachments` is the single seam for that; everything else
// in the feature is finished and does not change when it lands.

/** Per file. Chosen to match what the CAM flow already accepts for document uploads. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_FILES = 10;

/** Extensions rather than MIME types: browsers disagree on the office ones (.docx arrives as
 * application/zip often enough that a MIME allowlist rejects valid files). */
export const ACCEPTED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv',
  '.txt', '.md', '.png', '.jpg', '.jpeg', '.webp',
] as const;

/** The `accept` attribute for the file input — same list, comma-joined. */
export const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(',');

export interface Attachment {
  /** Stable across re-renders so React keys and revoke-on-remove behave. */
  id: string;
  file: File;
  /** Object URL for images only; null otherwise. Must be revoked when the attachment goes. */
  previewUrl: string | null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

export function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

/** Why a file was rejected, or null if it is fine. */
export function rejectionReason(file: File): string | null {
  if (!ACCEPTED_EXTENSIONS.includes(extensionOf(file.name) as typeof ACCEPTED_EXTENSIONS[number])) {
    return `${file.name}: unsupported file type`;
  }
  if (file.size === 0) return `${file.name}: file is empty`;
  if (file.size > MAX_FILE_BYTES) {
    return `${file.name}: larger than ${formatBytes(MAX_FILE_BYTES)}`;
  }
  return null;
}

/**
 * Validate a picked/dropped batch against what is already attached. Returns the ones to keep
 * plus a message naming everything refused — partial success rather than dropping the whole
 * batch because one file was wrong.
 */
export function acceptFiles(
  incoming: File[],
  existing: Attachment[],
): { accepted: Attachment[]; error: string | null } {
  const problems: string[] = [];
  const accepted: Attachment[] = [];
  let slots = MAX_FILES - existing.length;

  for (const file of incoming) {
    const reason = rejectionReason(file);
    if (reason) {
      problems.push(reason);
      continue;
    }
    // Same name and size already attached — almost certainly a double-drop.
    const duplicate =
      existing.some(a => a.file.name === file.name && a.file.size === file.size) ||
      accepted.some(a => a.file.name === file.name && a.file.size === file.size);
    if (duplicate) continue;

    if (slots <= 0) {
      problems.push(`${file.name}: over the ${MAX_FILES}-file limit`);
      continue;
    }
    slots -= 1;
    accepted.push({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: isImage(file) ? URL.createObjectURL(file) : null,
    });
  }

  return { accepted, error: problems.length ? problems.join('; ') : null };
}

/** Free the object URLs an attachment list holds. Call on removal and on unmount. */
export function releaseAttachments(attachments: Attachment[]): void {
  for (const a of attachments) {
    if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
  }
}

/**
 * TODO(backend): the only unimplemented piece of this feature.
 *
 * When an upload endpoint exists, replace the throw with the real call and return whatever
 * the ask endpoints need to reference the files (ids, or the multipart body itself). Callers
 * already surface the rejection to the user, so nothing silently loses an attachment in the
 * meantime.
 */
export async function uploadAttachments(_attachments: Attachment[]): Promise<never> {
  throw new Error(
    'File upload is not connected yet — the chat API is text-only. Remove the attachment to send your message.',
  );
}
