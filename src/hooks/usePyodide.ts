import { useRef, useCallback, useEffect, useState } from 'react';

interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<any>;
  setStdout: (opts: { batched: (text: string) => void }) => void;
  setStderr: (opts: { batched: (text: string) => void }) => void;
}

declare global {
  interface Window {
    loadPyodide: (opts?: { indexURL?: string }) => Promise<PyodideInstance>;
  }
}

export const usePyodide = () => {
  const pyodideRef = useRef<PyodideInstance | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPyodide = useCallback(async () => {
    if (pyodideRef.current) {
      setReady(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load pyodide script if not already loaded
      if (!window.loadPyodide) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Pyodide'));
          document.head.appendChild(script);
        });
      }

      const pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
      });

      pyodideRef.current = pyodide;
      setReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Python engine');
    } finally {
      setLoading(false);
    }
  }, []);

  const runCode = useCallback(async (code: string): Promise<{ output: string; error: string | null }> => {
    if (!pyodideRef.current) {
      return { output: '', error: 'Python engine not loaded' };
    }

    let stdout = '';
    let stderr = '';

    pyodideRef.current.setStdout({
      batched: (text: string) => { stdout += text + '\n'; },
    });
    pyodideRef.current.setStderr({
      batched: (text: string) => { stderr += text + '\n'; },
    });

    try {
      const result = await pyodideRef.current.runPythonAsync(code);
      // If the code returns a value and there's no print output, show the result
      if (result !== undefined && result !== null && !stdout.trim()) {
        stdout = String(result) + '\n';
      }
      return { output: stdout, error: stderr || null };
    } catch (err: any) {
      return { output: stdout, error: err.message || 'Runtime error' };
    }
  }, []);

  // Auto-load on mount
  useEffect(() => {
    loadPyodide();
  }, [loadPyodide]);

  return { loading, ready, error, runCode, loadPyodide };
};
