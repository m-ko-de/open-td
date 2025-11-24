import { PersistenceManager } from './PersistenceManager';
import { AuthManager } from '../auth/AuthManager';

export interface ErrorReportPayload {
  message: string;
  stack?: string | null;
  url: string;
  timestamp: string;
  userAgent: string;
  extra?: any;
}

/**
 * Centralized in-browser error reporter. Keeps a local copy of errors and optionally
 * sends them to the server via PersistenceManager.
 */
export class ErrorReporter {
  private persistence = PersistenceManager.getInstance();
  private installed = false;

  constructor() {}

  public async report(err: any, extra?: any): Promise<void> {
    try {
      const payload: ErrorReportPayload = {
        message: err?.message || String(err) || 'Unknown error',
        stack: err?.stack || null,
        url: (typeof window !== 'undefined' && window.location && window.location.href) || 'unknown',
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        extra,
      };

      // Persist locally first
      const auth = AuthManager.getInstance();
      const authToken = auth.getAuthToken();
      await this.persistence.saveErrorReport(payload, authToken || undefined);

      // Also log to console
      // Keep this verbose as we want instant local visibility
      console.error('Global error captured and persisted:', payload);
    } catch (reportErr) {
      // Swallow errors from the reporter itself
      console.error('ErrorReporter failed while reporting an error:', reportErr);
    }
  }

  public installGlobalHandlers(options?: { onRestart?: () => void; maxRestarts?: number }) {
    if (this.installed) return;
    this.installed = true;
    const restartFn = options?.onRestart;
    let restartAttempts = 0;
    let firstAttemptAt: number | null = null;

    const tryRestart = () => {
      const now = Date.now();
      if (!firstAttemptAt) firstAttemptAt = now;
      // Reset attempt window every 30s
      if (firstAttemptAt && now - firstAttemptAt > 30_000) {
        restartAttempts = 0;
        firstAttemptAt = now;
      }

      restartAttempts += 1;
      const maxAttempts = options?.maxRestarts ?? 3;
      if (restartAttempts > maxAttempts) {
        // Give up and document
        console.error('Too many restart attempts, will not restart again automatically.');
        return;
      }

      try {
        if (typeof restartFn === 'function') {
          restartFn();
        } else {
          // No restart function available — fallback to reload
          if (typeof window !== 'undefined') window.location.reload();
        }
      } catch (e) {
        console.error('Failed to restart game via restart function:', e);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('error', (ev: ErrorEvent) => {
        // Avoid crashing the handler if there is some broken property
        try {
          // Collect info and report
          const err = ev.error || { message: ev.message };
          this.report(err, { filename: ev.filename, lineno: ev.lineno, colno: ev.colno });
        } catch (e) {
          console.error('Error inside global error handler:', e);
        }
        // Try a restart after reporting
        tryRestart();
      });

      window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
        try {
          const err = ev.reason || { message: 'Unhandled rejection' };
          this.report(err, { reason: ev.reason });
        } catch (e) {
          console.error('Error inside unhandledrejection handler:', e);
        }
        tryRestart();
      });
    }
  }
}

export const errorReporter = new ErrorReporter();

export default errorReporter;
