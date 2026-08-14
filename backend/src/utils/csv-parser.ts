export interface ParsedCsvResult {
  headers: string[];
  rows: Record<string, string>[];
  rawRows: string[][];
  errors: string[];
}

export function parseCsvString(csvText: string, maxRows = 5000): ParsedCsvResult {
  const errors: string[] = [];

  // Remove UTF-8 BOM if present
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  if (!cleanText || !cleanText.trim()) {
    return { headers: [], rows: [], rawRows: [], errors: ["CSV file is empty"] };
  }

  // Parse lines considering quotes and escaped quotes
  const lines: string[][] = [];
  let currentField = "";
  let currentLine: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentLine.push(currentField.trim());
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      currentLine.push(currentField.trim());
      if (currentLine.some((field) => field !== "")) {
        lines.push(currentLine);
      }
      currentLine = [];
      currentField = "";

      if (lines.length > maxRows + 1) {
        errors.push(`File exceeds maximum limit of ${maxRows} rows`);
        break;
      }
    } else {
      currentField += char;
    }
  }

  if (currentField !== "" || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    if (currentLine.some((field) => field !== "")) {
      lines.push(currentLine);
    }
  }

  if (inQuotes) {
    errors.push("Malformed CSV: Unclosed quotation mark found");
  }

  if (lines.length === 0) {
    return { headers: [], rows: [], rawRows: [], errors: ["No valid data rows found"] };
  }

  const rawHeaders = lines[0];
  const headers = rawHeaders.map((h) => h.replace(/^["']|["']$/g, "").trim());
  const rawRows = lines.slice(1);

  const rows: Record<string, string>[] = [];
  rawRows.forEach((rowValues) => {
    const rowObj: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header) {
        rowObj[header] = rowValues[index] !== undefined ? rowValues[index] : "";
      }
    });
    rows.push(rowObj);
  });

  return {
    headers,
    rows,
    rawRows,
    errors,
  };
}
