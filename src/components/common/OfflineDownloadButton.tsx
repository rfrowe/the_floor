import { useState } from 'react';
import { Modal } from './Modal';
import { Spinner } from './Spinner';
import { Button } from './Button';
import { useOfflineCache } from '@hooks/useOfflineCache';
import { formatBytes } from '@utils/storageUtils';
import styles from './OfflineDownloadButton.module.css';

/**
 * Top-bar control that caches all sample categories (and, via the service
 * worker, the app shell) for full offline use. The button face reflects the
 * current state; clicking it opens a modal to download, cancel, or clear.
 */
export function OfflineDownloadButton() {
  const { state, supported, status, progress, error, start, cancel, clear } = useOfflineCache();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hide entirely when the browser lacks Cache Storage / Service Worker support.
  if (!supported) {
    return null;
  }

  const cachedCount = status?.cachedCount ?? 0;
  const totalCount = status?.totalCount ?? 0;
  const completed = progress?.completed ?? 0;
  const isPartial = state === 'idle' && cachedCount > 0 && cachedCount < totalCount;
  const percent = totalCount > 0 ? Math.round((completed / totalCount) * 100) : 0;

  let icon = '📥';
  let label = 'Offline';
  let buttonTitle = 'Download sample categories for offline use';
  if (state === 'downloading') {
    label = `${String(percent)}%`;
    buttonTitle = 'Downloading for offline use…';
  } else if (state === 'ready') {
    icon = '✅';
    buttonTitle = 'Available offline — click to manage';
  } else if (state === 'error') {
    icon = '⚠️';
    buttonTitle = 'Offline download failed — click to retry';
  } else if (isPartial) {
    icon = '⚠️';
    buttonTitle = `Offline data incomplete (${String(cachedCount)}/${String(totalCount)}) — click to finish`;
  }

  const toggleClass = styles['toggle'] ?? '';
  const stateClass =
    state === 'ready'
      ? (styles['ready'] ?? '')
      : state === 'error' || isPartial
        ? (styles['warn'] ?? '')
        : '';
  const iconClass = styles['icon'] ?? '';
  const labelClass = styles['label'] ?? '';
  const barClass = styles['bar'] ?? '';
  const barFillClass = styles['bar-fill'] ?? '';
  const detailClass = styles['detail'] ?? '';
  const noteClass = styles['note'] ?? '';

  const storageLine =
    status && status.quota > 0
      ? `Storage: ${formatBytes(status.usage)} used of ${formatBytes(status.quota)} available`
      : null;

  const renderBody = () => {
    if (state === 'downloading') {
      return (
        <div className={detailClass}>
          <Spinner
            size="small"
            label={`Caching ${String(completed)} of ${String(totalCount)} categories…`}
          />
          <div
            className={barClass}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className={barFillClass} style={{ width: `${String(percent)}%` }} />
          </div>
          <p>
            {formatBytes(progress?.bytes ?? 0)} downloaded
            {progress?.currentName ? ` · ${progress.currentName}` : ''}
          </p>
          <p className={noteClass}>Keep this tab open until the download finishes.</p>
        </div>
      );
    }

    if (state === 'ready') {
      return (
        <div className={detailClass}>
          <p>
            All {String(totalCount)} sample categories are saved for offline use. You can turn off
            your network and every feature will keep working — including creating contestants with
            categories you haven&apos;t opened yet.
          </p>
          {status?.summary && (
            <p className={noteClass}>
              Downloaded {new Date(status.summary.downloadedAt).toLocaleString()}
              {status.summary.persisted ? ' · storage marked persistent' : ''}
            </p>
          )}
          {storageLine && <p className={noteClass}>{storageLine}</p>}
          <p className={noteClass}>
            Note: some browsers (notably Safari) may clear offline data after a period of
            inactivity. Re-download if categories stop loading offline.
          </p>
        </div>
      );
    }

    if (state === 'error') {
      return (
        <div className={detailClass}>
          <p>{error ?? 'The offline download failed.'}</p>
          {cachedCount > 0 && (
            <p className={noteClass}>
              {String(cachedCount)} of {String(totalCount)} categories were cached. Retrying resumes
              where it left off.
            </p>
          )}
          {storageLine && <p className={noteClass}>{storageLine}</p>}
        </div>
      );
    }

    // idle (fresh or partial)
    return (
      <div className={detailClass}>
        <p>
          Download all {String(totalCount)} sample categories so the entire site works without a
          network connection. This is a large download (roughly 200&nbsp;MB) and may take a few
          minutes.
        </p>
        {isPartial && (
          <p className={noteClass}>
            Offline data is incomplete: {String(cachedCount)} of {String(totalCount)} cached. Resume
            to finish.
          </p>
        )}
        {storageLine && <p className={noteClass}>{storageLine}</p>}
      </div>
    );
  };

  const renderFooter = () => {
    if (state === 'downloading') {
      return (
        <Button variant="secondary" onClick={cancel}>
          Cancel
        </Button>
      );
    }
    if (state === 'ready') {
      return (
        <>
          <Button variant="danger" onClick={() => void clear()}>
            Clear offline data
          </Button>
          <Button variant="secondary" onClick={start}>
            Re-download
          </Button>
        </>
      );
    }
    if (state === 'error') {
      return (
        <>
          {cachedCount > 0 && (
            <Button variant="danger" onClick={() => void clear()}>
              Clear
            </Button>
          )}
          <Button variant="primary" onClick={start}>
            Try again
          </Button>
        </>
      );
    }
    // idle
    return (
      <>
        {isPartial && (
          <Button variant="danger" onClick={() => void clear()}>
            Clear
          </Button>
        )}
        <Button variant="primary" onClick={start}>
          {isPartial ? 'Resume download' : 'Download for offline use'}
        </Button>
      </>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsModalOpen(true);
        }}
        className={`${toggleClass} ${stateClass}`.trim()}
        aria-label={buttonTitle}
        title={buttonTitle}
      >
        {state === 'downloading' ? (
          <Spinner size="small" />
        ) : (
          <span className={iconClass} role="img" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className={labelClass}>{label}</span>
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        title="Offline mode"
        footer={renderFooter()}
      >
        {renderBody()}
      </Modal>
    </>
  );
}
