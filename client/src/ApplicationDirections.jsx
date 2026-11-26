import { useLang } from './useLang';

export default function ApplicationDirections({ application }) {
  const { t } = useLang();
  if (!application?.online && !application?.visit) return null;

  return (
    <div className="application-directions">
      <strong>{t('howToGetBenefit')}</strong>
      {application.online && (
        <>
          <p lang="en" dir="ltr">{application.online}</p>
          <p><a href={application.url} target="_blank" rel="noreferrer">{t('openOfficialPortal')}</a></p>
        </>
      )}
      {application.visit && <p lang="en" dir="ltr">{application.visit}</p>}
    </div>
  );
}
