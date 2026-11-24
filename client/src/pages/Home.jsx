import { Link } from 'react-router-dom';
import { useLang } from '../useLang';

export default function Home() {
  const { t } = useLang();

  return (
    <main className="page home-page">
      <section className="home-intro">
        <div className="home-copy">
          <h1>{t('homeTitle')}</h1>
          <p>{t('homeIntro')}</p>
          <div className="home-actions">
            <Link className="primary-action" to="/my-schemes">
              {t('findSchemes')} <span className="direction-arrow" aria-hidden="true">→</span>
            </Link>
            <Link className="secondary-action" to="/schemes">{t('browse')}</Link>
          </div>
        </div>
        <section className="home-help" aria-labelledby="home-help-title">
          <h2 id="home-help-title"><span className="chat-mark" aria-hidden="true" />{t('schemeChat')}</h2>
          <div className="home-help-body">
            <p>{t('chatIntro')}</p>
            <div className="home-prompts">
              <Link to="/scheme-chat?topic=eligibility">
                {t('eligibility')} <span className="direction-arrow" aria-hidden="true">→</span>
              </Link>
              <Link to="/scheme-chat?topic=apply">
                {t('helpApply')} <span className="direction-arrow" aria-hidden="true">→</span>
              </Link>
            </div>
            <Link className="home-help-link" to="/scheme-chat">{t('chatQuestion')} <span aria-hidden="true">↗</span></Link>
          </div>
        </section>
      </section>
    </main>
  );
}
