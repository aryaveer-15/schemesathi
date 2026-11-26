import { useLang } from './useLang';

export default function LoadingState({ variant }) {
  const { t } = useLang();
  const placeholders = variant === 'catalog' ? [1, 2, 3] : [1];

  return (
    <div className="loading-state" data-variant={variant}>
      <p className="status" role="status">{t('loading')}…</p>
      <div aria-hidden="true" className="skeleton-items">
        {placeholders.map((row) => (
          <div className="skeleton-row" key={row}>
            {variant !== 'questionnaire' && <div className="skeleton-photo" />}
            <div className="skeleton-copy">
              <div className="skeleton-line skeleton-title" />
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-short" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
