"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Paperclip,
  UploadCloud,
  FileText,
  FileCode,
  Image as ImageIcon,
  FileArchive,
  Download,
  Trash2,
  Eye,
  AlertCircle,
  X,
  CheckCircle2,
} from "lucide-react";

export interface AttachmentItem {
  id: string;
  organizationId: string;
  uploadedById: string;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  entityType: string;
  entityId: string;
  createdAt: string;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AttachmentsSectionProps {
  entityType: "COMPANY" | "CONTACT" | "LEAD" | "DEAL" | "TASK" | "ACTIVITY" | "COMMENT";
  entityId: string;
}

const DANGEROUS_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".sh", ".bash", ".php", ".js", ".jsx", ".ts", ".tsx",
  ".vbs", ".scr", ".msi", ".dll", ".com", ".ps1", ".jar", ".py", ".pl", ".cgi",
  ".asp", ".aspx", ".jsp", ".htm", ".html", ".svg"
]);

export function AttachmentsSection({ entityType, entityId }: AttachmentsSectionProps) {
  const { user, isViewer } = useAuth();
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAttachments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/v1/attachments?entityType=${entityType}&entityId=${entityId}`, { headers });
      const json = await res.json();

      if (json.success && json.data) {
        setAttachments(json.data.attachments || []);
      } else {
        setError(json.error || "Failed to load attachments");
      }
    } catch {
      setError("Network error loading attachments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (entityId) {
      fetchAttachments();
    }
  }, [entityType, entityId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isViewer) return;

    // Reset input value so re-selecting same file works
    e.target.value = "";

    // 1. File Size Validation (25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError("File exceeds 25MB maximum upload limit");
      return;
    }

    // 2. File Extension Guard
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (DANGEROUS_EXTENSIONS.has(ext)) {
      setError(`Security Alert: "${ext}" executable or dangerous file types are strictly prohibited.`);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(20);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", entityType);
      formData.append("entityId", entityId);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      setUploadProgress(60);

      const res = await fetch("http://localhost:5000/api/v1/attachments", {
        method: "POST",
        headers,
        body: formData,
      });

      const json = await res.json();
      setUploadProgress(100);

      if (json.success && json.data?.attachment) {
        setAttachments((prev) => [json.data.attachment, ...prev]);
      } else {
        setError(json.error || "Failed to upload attachment");
      }
    } catch {
      setError("Failed to upload file due to network error");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (attachment: AttachmentItem) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/v1/attachments/${attachment.id}/download`, { headers });
      if (!res.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.originalFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError("Download failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/v1/attachments/${id}`, {
        method: "DELETE",
        headers,
      });

      const json = await res.json();
      if (json.success) {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
      } else {
        setError(json.error || "Failed to delete attachment");
      }
    } catch {
      setError("Delete request failed");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getFileIcon = (mimeType: string, filename: string) => {
    if (mimeType.startsWith("image/")) {
      return <ImageIcon className="w-4 h-4 text-emerald-500" />;
    }
    if (mimeType.includes("pdf") || filename.endsWith(".pdf")) {
      return <FileText className="w-4 h-4 text-rose-500" />;
    }
    if (mimeType.includes("zip") || mimeType.includes("tar") || filename.endsWith(".zip")) {
      return <FileArchive className="w-4 h-4 text-amber-500" />;
    }
    return <FileText className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Attachments</h3>
          <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
            {attachments.length}
          </span>
        </div>

        {!isViewer && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              {isUploading ? "Uploading..." : "Upload File"}
            </button>
          </div>
        )}
      </div>

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="space-y-1 bg-primary/5 p-3 rounded-lg border border-primary/20">
          <div className="flex justify-between text-xs font-medium text-foreground">
            <span>Uploading file...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attachments List */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading attachments...
          </div>
        ) : attachments.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg p-4">
            No files attached yet. Click "Upload File" to add proposals, contracts, or documents.
          </div>
        ) : (
          attachments.map((item) => {
            const isOwner = user?.id === item.uploadedById;

            return (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-border/70 bg-muted/20 hover:bg-muted/50 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-accent shrink-0">
                    {getFileIcon(item.mimeType, item.originalFileName)}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate" title={item.originalFileName}>
                      {item.originalFileName}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span>{formatFileSize(item.size)}</span>
                      <span>•</span>
                      <span>Uploaded by {item.uploadedBy?.firstName || "User"}</span>
                      <span>•</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleDownload(item)}
                    className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-accent transition-colors"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-500 rounded-md hover:bg-accent transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
