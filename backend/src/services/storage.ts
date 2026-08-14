import fs from "fs";
import path from "path";

export interface StorageProvider {
  saveFile(buffer: Buffer, storageKey: string): Promise<string>;
  getFileStream(storageKey: string): Promise<fs.ReadStream>;
  getFileBuffer(storageKey: string): Promise<Buffer>;
  deleteFile(storageKey: string): Promise<boolean>;
  fileExists(storageKey: string): Promise<boolean>;
}

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    this.baseDir = customBaseDir || path.join(process.cwd(), "uploads");
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private resolvePath(storageKey: string): string {
    // Sanitize storage key to prevent directory traversal
    const safeKey = path.normalize(storageKey).replace(/^(\.\.[\/\\])+/, "");
    return path.join(this.baseDir, safeKey);
  }

  async saveFile(buffer: Buffer, storageKey: string): Promise<string> {
    const filePath = this.resolvePath(storageKey);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(filePath, buffer);
    return storageKey;
  }

  async getFileStream(storageKey: string): Promise<fs.ReadStream> {
    const filePath = this.resolvePath(storageKey);
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found in storage");
    }
    return fs.createReadStream(filePath);
  }

  async getFileBuffer(storageKey: string): Promise<Buffer> {
    const filePath = this.resolvePath(storageKey);
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found in storage");
    }
    return fs.promises.readFile(filePath);
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    try {
      const filePath = this.resolvePath(storageKey);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async fileExists(storageKey: string): Promise<boolean> {
    const filePath = this.resolvePath(storageKey);
    return fs.existsSync(filePath);
  }
}

export const storageProvider: StorageProvider = new LocalStorageProvider();

/**
 * List of dangerous executable extensions strictly prohibited from upload
 */
export const DANGEROUS_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".sh", ".bash", ".php", ".js", ".jsx", ".ts", ".tsx",
  ".vbs", ".scr", ".msi", ".dll", ".com", ".ps1", ".jar", ".py", ".pl", ".cgi",
  ".asp", ".aspx", ".jsp", ".htm", ".html", ".svg"
]);

export function isDangerousExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return DANGEROUS_EXTENSIONS.has(ext);
}

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
