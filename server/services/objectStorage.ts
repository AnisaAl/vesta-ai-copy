import fs from "fs/promises";
import path from "path";

export type StorageMode = "local" | "s3";

export interface StoredObject {
  key: string;
  /** App-relative or absolute URL clients can use to fetch the object */
  url: string;
}

/**
 * Cloud-ready object storage boundary.
 * local: filesystem under STORAGE_LOCAL_ROOT (default ./uploads)
 * s3: stub for later S3/R2 — same interface, swap via STORAGE_MODE
 */
export interface ObjectStorage {
  readonly mode: StorageMode;
  ensureReady(): Promise<void>;
  putObject(key: string, data: Buffer, contentType?: string): Promise<StoredObject>;
  getPublicUrl(key: string): string;
}

class LocalObjectStorage implements ObjectStorage {
  readonly mode: StorageMode = "local";
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  async ensureReady(): Promise<void> {
    await fs.mkdir(this.root, { recursive: true });
  }

  async putObject(key: string, data: Buffer, _contentType?: string): Promise<StoredObject> {
    const safeKey = key.replace(/^\/+/, "").replace(/\.\./g, "");
    const fullPath = path.join(this.root, safeKey);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
    return { key: safeKey, url: this.getPublicUrl(safeKey) };
  }

  getPublicUrl(key: string): string {
    const safeKey = key.replace(/^\/+/, "");
    return `/uploads/${safeKey}`;
  }
}

/** Placeholder for future S3/R2 — keeps call sites stable when lifting to cloud. */
class S3ObjectStorageStub implements ObjectStorage {
  readonly mode: StorageMode = "s3";

  async ensureReady(): Promise<void> {
    throw new Error(
      "STORAGE_MODE=s3 is not implemented yet. Set STORAGE_MODE=local for MVP, or implement S3/R2 in objectStorage.ts."
    );
  }

  async putObject(): Promise<StoredObject> {
    await this.ensureReady();
    throw new Error("unreachable");
  }

  getPublicUrl(key: string): string {
    const base = process.env.STORAGE_PUBLIC_BASE_URL;
    if (!base) {
      throw new Error("STORAGE_PUBLIC_BASE_URL is required when STORAGE_MODE=s3");
    }
    return `${base.replace(/\/$/, "")}/${key.replace(/^\/+/, "")}`;
  }
}

export function createObjectStorage(): ObjectStorage {
  const mode = (process.env.STORAGE_MODE || "local").toLowerCase() as StorageMode;
  if (mode === "s3") {
    return new S3ObjectStorageStub();
  }
  const root = process.env.STORAGE_LOCAL_ROOT || path.join(process.cwd(), "uploads");
  return new LocalObjectStorage(root);
}

export const objectStorage = createObjectStorage();
