import { Link } from 'react-router-dom';
import { useLang } from '../useLang';

export default function Home() {
  const { t } = useLang();

  return (
    <main className="page home-page">
      <div className="home-layout">
        <section className="home-intro" aria-labelledby="home-heading">
          <div className="home-copy">
            <h1 id="home-heading">{t('homeTitle')}</h1>
            <p>{t('homeIntro')}</p>
            <div className="home-actions">
              <Link className="primary-action" to="/my-schemes">
                {t('findSchemes')} <span className="direction-arrow" aria-hidden="true">→</span>
              </Link>
              <Link className="secondary-action" to="/schemes">{t('browse')}</Link>
            </div>
          </div>
        </section>
        <section className="home-help" aria-labelledby="home-help-title">
          <h2 id="home-help-title">{t('schemeChat')}</h2>
          <div className="home-help-body">
            <p>{t('chatIntro')}</p>
            <ul className="home-prompts">
              <li><Link to="/scheme-chat?topic=eligibility">
                {t('eligibility')} <span className="direction-arrow" aria-hidden="true">→</span>
              </Link></li>
              <li><Link to="/scheme-chat?topic=apply">
                {t('helpApply')} <span className="direction-arrow" aria-hidden="true">→</span>
              </Link></li>
            </ul>
            <Link className="home-help-link" to="/scheme-chat">{t('chatQuestion')} <span aria-hidden="true">↗</span></Link>
          </div>
        </section>
      </div>
    </main>
  );
}
