export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const payload: LogEntry = { timestamp, level, message };
    if (meta && Object.keys(meta).length > 0) {
      payload.meta = meta;
    }
    return JSON.stringify(payload);
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    console.log(this.formatMessage("info", message, meta));
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(this.formatMessage("warn", message, meta));
  }

  public error(message: string, meta?: Record<string, unknown>): void {
    console.error(this.formatMessage("error", message, meta));
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.formatMessage("debug", message, meta));
    }
  }
}

export const logger = new Logger();
