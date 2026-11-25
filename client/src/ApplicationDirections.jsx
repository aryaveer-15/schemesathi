import { useLang } from './useLang';

export default function ApplicationDirections({ application }) {
  const { t } = useLang();
  if (!application?.online && !application?.visit) return null;

  return (
    <div className="application-directions">
      <strong>{t('howToGetBenefit')}</strong>
      {application.online && (
        <p>
          {application.online}{' '}
          <a href={application.url} target="_blank" rel="noreferrer">{t('openOfficialPortal')}</a>
        </p>
      )}
      {application.visit && <p>{application.visit}</p>}
    </div>
  );
}
