import { Link } from 'react-router-dom';
import { useLang } from '../useLang';

export default function Home() {
  const { t } = useLang();

  return (
    <main className="page">
      <section className="home-intro">
        <h1>{t('homeTitle')}</h1>
        <p>{t('homeIntro')}</p>
        <div className="home-actions">
          <Link className="primary-action" to="/my-schemes">{t('findSchemes')}</Link>
          <Link className="secondary-action" to="/schemes">{t('browse')}</Link>
        </div>
      </section>
    </main>
  );
}
