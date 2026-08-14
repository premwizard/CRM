"use client";

import React, { useState } from "react";
import { Modal } from "./modal";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface ValidationResult {
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  headers: string[];
  validationErrors: { rowNumber: number; error: string }[];
  parsedRows: {
    rowNumber: number;
    data: Record<string, string>;
    isValid: boolean;
    errors: string[];
  }[];
}

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: "contacts" | "companies" | "leads";
  onSuccess: () => void;
}

export function CsvImportModal({
  isOpen,
  onClose,
  entity,
  onSuccess,
}: CsvImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState<string>("");
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationData, setValidationData] = useState<ValidationResult | null>(null);
  const [allowPartial, setAllowPartial] = useState(true);
  const [importedSummary, setImportedSummary] = useState<{ imported: number; skipped: number } | null>(null);

  const entityTitle =
    entity === "contacts" ? "Contacts" : entity === "companies" ? "Companies" : "Leads";

  const handleReset = () => {
    setStep(1);
    setFile(null);
    setCsvText("");
    setValidating(false);
    setImporting(false);
    setErrorMsg(null);
    setValidationData(null);
    setImportedSummary(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith(".csv")) {
      setErrorMsg("Please upload a valid .csv file.");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setErrorMsg("File size exceeds 5MB upload limit.");
      return;
    }

    setErrorMsg(null);
    setFile(selected);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content || "");
    };
    reader.readAsText(selected);
  };

  const handleValidate = async () => {
    if (!csvText) {
      setErrorMsg("No CSV data loaded");
      return;
    }

    setValidating(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/import/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, csvContent: csvText }),
      });

      const data = await res.json();
      setValidating(false);

      if (res.ok && data.success) {
        setValidationData(data.data);
        setStep(2);
      } else {
        setErrorMsg(data.error || "Failed to parse and validate CSV file.");
      }
    } catch {
      setValidating(false);
      setErrorMsg("Network error occurred during validation.");
    }
  };

  const handleExecuteImport = async () => {
    if (!validationData) return;

    const rowsToImport = allowPartial
      ? validationData.parsedRows.filter((r) => r.isValid).map((r) => r.data)
      : validationData.parsedRows.map((r) => r.data);

    if (rowsToImport.length === 0) {
      setErrorMsg("No valid rows available to import.");
      return;
    }

    setImporting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity,
          rows: rowsToImport,
          allowPartial,
        }),
      });

      const data = await res.json();
      setImporting(false);

      if (res.ok && data.success) {
        setImportedSummary({
          imported: data.data.importedCount,
          skipped: data.data.skippedCount,
        });
        setStep(3);
        onSuccess();
      } else {
        setErrorMsg(data.error || "Import failed during execution.");
      }
    } catch {
      setImporting(false);
      setErrorMsg("Network error occurred during import execution.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Import ${entityTitle} from CSV`}
    >
      <div className="space-y-4">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-border pb-3 text-xs font-semibold text-muted-foreground">
          <span className={step === 1 ? "text-primary font-bold" : ""}>
            1. Select CSV File
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
          <span className={step === 2 ? "text-primary font-bold" : ""}>
            2. Validate & Preview
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
          <span className={step === 3 ? "text-primary font-bold" : ""}>
            3. Import Complete
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-xs text-red-500 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Import Error</p>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Upload File */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-lg p-8 text-center bg-secondary/30 transition-colors">
              <Upload className="w-8 h-8 mx-auto text-primary opacity-80 mb-2" />
              <p className="text-sm font-semibold text-foreground">
                Click to browse or drop CSV file here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports .csv files up to 5MB (max 5,000 rows)
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="mt-4 block w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
            </div>

            {file && (
              <div className="bg-card border border-border p-3 rounded-md flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{file.name}</span>
                  <span className="text-muted-foreground">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setCsvText("");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!file || validating}
                onClick={handleValidate}
                className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md text-xs hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
              >
                {validating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {validating ? "Validating..." : "Validate CSV"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Preview & Validation Errors */}
        {step === 2 && validationData && (
          <div className="space-y-4 py-1">
            {/* Validation Metrics Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-secondary/50 border border-border rounded-md text-center">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Total Rows
                </p>
                <p className="text-lg font-bold text-foreground">
                  {validationData.totalRows}
                </p>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-center">
                <p className="text-[10px] uppercase font-semibold text-emerald-600">
                  Valid Rows
                </p>
                <p className="text-lg font-bold text-emerald-600">
                  {validationData.validRowsCount}
                </p>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-center">
                <p className="text-[10px] uppercase font-semibold text-red-500">
                  Invalid Rows
                </p>
                <p className="text-lg font-bold text-red-500">
                  {validationData.invalidRowsCount}
                </p>
              </div>
            </div>

            {/* Validation Errors Panel */}
            {validationData.validationErrors.length > 0 && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-md p-3 max-h-36 overflow-y-auto space-y-1.5">
                <p className="text-xs font-bold text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Validation Errors Found ({validationData.validationErrors.length})
                </p>
                <div className="space-y-1">
                  {validationData.validationErrors.map((err, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] text-red-600/90 font-mono bg-red-500/10 px-2 py-0.5 rounded"
                    >
                      <strong>Row {err.rowNumber}:</strong> {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Partial Import Switch */}
            {validationData.invalidRowsCount > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-xs space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={allowPartial}
                    onChange={(e) => setAllowPartial(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span>
                    Import valid rows only (Skip {validationData.invalidRowsCount} invalid rows)
                  </span>
                </label>
                <p className="text-[11px] text-muted-foreground pl-6">
                  {allowPartial
                    ? `Only ${validationData.validRowsCount} valid rows will be imported to the database.`
                    : "Import will fail if any row contains errors."}
                </p>
              </div>
            )}

            {/* Rows Preview Table */}
            <div className="border border-border rounded-md overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="px-3 py-2 w-12 text-center">Row</th>
                    <th className="px-3 py-2 w-16 text-center">Status</th>
                    {validationData.headers.slice(0, 4).map((h) => (
                      <th key={h} className="px-3 py-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {validationData.parsedRows.slice(0, 10).map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={row.isValid ? "hover:bg-accent/40" : "bg-red-500/5"}
                    >
                      <td className="px-3 py-2 text-center font-mono font-semibold">
                        {row.rowNumber}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {row.isValid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                        )}
                      </td>
                      {validationData.headers.slice(0, 4).map((h) => (
                        <td key={h} className="px-3 py-2 truncate max-w-[120px]">
                          {row.data[h] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-xs font-medium"
              >
                Back to File Selection
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    importing ||
                    (validationData.validRowsCount === 0 && allowPartial) ||
                    (validationData.invalidRowsCount > 0 && !allowPartial)
                  }
                  onClick={handleExecuteImport}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md text-xs hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {importing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {importing
                    ? "Importing..."
                    : `Import ${
                        allowPartial
                          ? validationData.validRowsCount
                          : validationData.totalRows
                      } ${entityTitle}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Complete */}
        {step === 3 && importedSummary && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-foreground">
                Import Completed Successfully!
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Imported <strong>{importedSummary.imported}</strong> new {entityTitle} records.
                {importedSummary.skipped > 0 && (
                  <span> ({importedSummary.skipped} invalid rows skipped)</span>
                )}
              </p>
            </div>
            <div className="pt-4 border-t border-border flex justify-center">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-md text-xs hover:bg-primary/90"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
