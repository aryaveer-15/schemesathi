import ReviewText from './ReviewText';
import { useLang } from './useLang';

export default function ApplicationDirections({ application, slug, result = false }) {
  const { t } = useLang();
  if (!application?.online && !application?.visit) return null;

  return (
    <div className="application-directions">
      <strong>{t('howToGetBenefit')}</strong>
      {application.online && (
        <>
          <ReviewText as="p" reviewKey={(result ? 'result.' : 'application.') + slug + '.online'}
            alternateKey={result ? 'application.' + slug + '.online' : undefined} source={application.online} />
          <p><a href={application.url} target="_blank" rel="noreferrer">{t('openOfficialPortal')}</a></p>
        </>
      )}
      {application.visit && <ReviewText as="p" reviewKey={(result ? 'result.' : 'application.') + slug + '.visit'}
            alternateKey={result ? 'application.' + slug + '.visit' : undefined} source={application.visit} />}
    </div>
  );
}
