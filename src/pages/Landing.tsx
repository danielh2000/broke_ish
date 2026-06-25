import React, { useCallback, useState } from 'react';
import { Upload, FileText, TrendingDown } from 'lucide-react';
import { parseCSV } from '../utils/csvParser';
import { categoriseTransactions } from '../utils/categoriser';
import { Transaction } from '../types';

interface LandingProps {
  onDataReady: (transactions: Transaction[]) => void;
}

export function Landing({ onDataReady }: LandingProps) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'categorising' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setErrorMsg('Please upload a .csv file.');
      setStatus('error');
      return;
    }

    setStatus('parsing');
    setErrorMsg('');

    try {
      const raw = await parseCSV(file);
      setStatus('categorising');
      setProgress(0);

      const categorised = await categoriseTransactions(raw, (done, total) => {
        setProgress(Math.round((done / total) * 100));
      });

      setStatus('done');
      onDataReady(categorised);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  }, [onDataReady]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const busy = status === 'parsing' || status === 'categorising';

  return (
    <div className="landing">
      <div className="landing-bg-texture" aria-hidden="true" />

      <header className="landing-header">
        <div className="logo">
          <TrendingDown size={22} strokeWidth={2.5} />
          <span>imali<span className="logo-accent">yami</span></span>
        </div>
      </header>

      <main className="landing-main">
        <div className="hero">
          <p className="hero-eyebrow">imali yami — personal finance, honestly</p>
          <h1 className="hero-title">
            Know exactly<br />
            where it all went.
          </h1>
          <p className="hero-sub">
            Drop in your bank's CSV export. We'll categorise every transaction
            and give you a clean picture of your spending — no accounts, no subscriptions, no nonsense.
          </p>
        </div>

        <div
          className={`upload-zone ${dragging ? 'dragging' : ''} ${busy ? 'busy' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {busy ? (
            <div className="upload-status">
              <div className="spinner" />
              <p className="status-label">
                {status === 'parsing' ? 'Reading your transactions…' : `Categorising… ${progress}%`}
              </p>
              {status === 'categorising' && (
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="upload-icon-wrap">
                <Upload size={28} strokeWidth={1.5} />
              </div>
              <p className="upload-label">
                Drag your CSV here, or{' '}
                <label className="upload-link">
                  browse
                  <input
                    type="file"
                    accept=".csv"
                    onChange={onInputChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </p>
              <p className="upload-hint">
                Works with FNB, Capitec, Standard Bank, Nedbank, ABSA, and most other banks
              </p>
            </>
          )}
        </div>

        {status === 'error' && (
          <p className="error-msg">
            <span>⚠</span> {errorMsg}
          </p>
        )}

        <div className="how-it-works">
          <div className="step">
            <FileText size={18} strokeWidth={1.5} />
            <span>Export CSV from your banking app</span>
          </div>
          <div className="step-divider" />
          <div className="step">
            <Upload size={18} strokeWidth={1.5} />
            <span>Drop it here</span>
          </div>
          <div className="step-divider" />
          <div className="step">
            <TrendingDown size={18} strokeWidth={1.5} />
            <span>See where your money goes</span>
          </div>
        </div>
      </main>
    </div>
  );
}