"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Mail, Send, X, AlertCircle, CheckCircle2, Paperclip } from "lucide-react";

interface EmailComposerProps {
  defaultTo?: string;
  contactId?: string;
  companyId?: string;
  leadId?: string;
  dealId?: string;
  recipientName?: string;
  onEmailSent?: () => void;
}

export function EmailComposer({
  defaultTo = "",
  contactId,
  companyId,
  leadId,
  dealId,
  recipientName,
  onEmailSent,
}: EmailComposerProps) {
  const { isViewer } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handleOpen = () => {
    setTo(defaultTo);
    setError(null);
    setSuccessMessage(null);
    setIsOpen(true);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;

    if (!to.trim()) {
      setError("Recipient email (To) is required");
      return;
    }

    if (!validateEmail(to)) {
      setError(`Invalid recipient email address: "${to}"`);
      return;
    }

    if (!subject.trim()) {
      setError("Subject line is required");
      return;
    }

    if (!body.trim()) {
      setError("Email message body is required");
      return;
    }

    try {
      setIsSending(true);
      setError(null);
      setSuccessMessage(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const payload = {
        to: to.trim(),
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
        subject: subject.trim(),
        body: body.trim(),
        contactId,
        companyId,
        leadId,
        dealId,
      };

      const res = await fetch("http://localhost:5000/api/v1/emails/send", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success && json.data?.status === "SENT") {
        setSuccessMessage(`Email successfully sent to ${to.trim()} and recorded in Activity log.`);
        setSubject("");
        setBody("");
        if (onEmailSent) onEmailSent();
        setTimeout(() => setIsOpen(false), 1500);
      } else {
        setError(json.error || "Failed to send email via email provider");
      }
    } catch {
      setError("Network error sending email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        disabled={isViewer}
        className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
      >
        <Mail className="w-3.5 h-3.5" />
        Send Email
      </button>

      {/* Composer Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">
                  New Email {recipientName ? `to ${recipientName}` : ""}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSend} className="p-5 flex-1 flex flex-col space-y-4 overflow-y-auto">
              {/* Alert Error / Success */}
              {error && (
                <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* To Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-foreground">To:</label>
                  {!showCcBcc && (
                    <button
                      type="button"
                      onClick={() => setShowCcBcc(true)}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Cc / Bcc
                    </button>
                  )}
                </div>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* CC & BCC Fields */}
              {showCcBcc && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Cc:</label>
                    <input
                      type="text"
                      value={cc}
                      onChange={(e) => setCc(e.target.value)}
                      placeholder="cc@example.com"
                      className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Bcc:</label>
                    <input
                      type="text"
                      value={bcc}
                      onChange={(e) => setBcc(e.target.value)}
                      placeholder="bcc@example.com"
                      className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}

              {/* Subject Field */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Subject:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Enterprise Proposal & Quote"
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 font-medium"
                />
              </div>

              {/* Body Field */}
              <div className="space-y-1 flex-1 flex flex-col">
                <label className="text-xs font-medium text-foreground">Message:</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Dear Customer,&#10;&#10;Thank you for discussing your requirements. Please find the proposal details below..."
                  className="w-full flex-1 text-xs p-3 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 resize-none min-h-[140px] leading-relaxed"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-[11px] text-muted-foreground">
                  Sent emails automatically record an EMAIL Activity.
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSending || !to.trim() || !subject.trim() || !body.trim()}
                    className="px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSending ? "Sending..." : "Send Email"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
