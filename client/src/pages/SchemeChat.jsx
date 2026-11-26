import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { schemeQuestions, schemeTitle } from '../eligibilityContent';
import { helpReply } from '../helpTopics';
import { getText } from '../locales';
import { localizedScheme } from '../schemeText';
import TranslationNotice from '../TranslationNotice';
import { useAuth } from '../useAuth';
import { useLang } from '../useLang';

const topics = [
  { key: 'eligibility', label: 'eligibility' },
  { key: 'apply', label: 'helpApply' },
  { key: 'account', label: 'register' },
];

const replies = {
  eligibility: { text: 'helpEligibilityAnswer', links: [['/my-schemes', 'findSchemes'], ['/eligibility', 'eligibility']] },
  apply: { text: 'helpApplyAnswer', links: [['/schemes', 'browse']] },
  account: { text: 'helpAccountAnswer', links: [['/register', 'register'], ['/login', 'login']] },
  fallback: { text: 'helpFallback', links: [] },
};

export default function SchemeChat() {
  const [params] = useSearchParams();
  const initialTopic = params.get('topic');
  return <ChatPanel key={initialTopic} initialTopic={initialTopic} />;
}

function ChatPanel({ initialTopic }) {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [messages, setMessages] = useState(() => {
    const topic = topics.find(({ key }) => key === initialTopic);
    return topic ? [{ label: topic.label, reply: { topic: topic.key } }] : [];
  });
  const [question, setQuestion] = useState('');
  const composer = useRef(null);
  const [announcedReply, setAnnouncedReply] = useState(null);
  const announcementKey = announcedReply?.topic && replies[announcedReply.topic].text;
  const announcement = announcedReply?.schemes
    ? announcedReply.schemes.map((slug) => schemeTitle(lang, slug)).join(', ')
    : announcementKey ? getText(announcementKey === 'helpApplyAnswer' ? 'en' : lang, announcementKey) : '';

  useEffect(() => {
    let active = true;
    api('/api/schemes').then((schemes) => {
      if (active && Array.isArray(schemes)) setCatalog(schemes);
    }).catch(() => {
      // General help and eligibility links stay available during a catalog outage.
    });
    return () => { active = false; };
  }, []);

  function addReply(message, reply) {
    setMessages((current) => [...current.slice(-7), { message, reply }]);
    setAnnouncedReply(reply);
    setQuestion('');
  }

  function sendQuestion(event) {
    event.preventDefault();
    const message = question.trim();
    if (message) {
      addReply(message, helpReply(message, t));
      composer.current?.focus();
    }
  }

  return (
    <main className="page">
      <h1>{t('schemeChat')}</h1>
      <p>{t('chatIntro')}</p>
      <div className="sr-only" role="status" lang={announcementKey === 'helpApplyAnswer' ? 'en' : lang}>
        {announcement}
      </div>
      <div className="eligibility-form">
        {messages.map(({ message, label, reply }, index) => (
          <div className="chat-turn" key={index}>
            <article className="card chat-message chat-message-question" dir="auto">
              <strong>{t('chatQuestion')}</strong>
              <p>{label ? t(label) : message}</p>
            </article>
            <article className="card chat-message chat-message-answer">
              <strong>{t('schemeChat')}</strong>
              {reply.schemes
                ? reply.schemes.map((slug) => (
                  <SchemeReply key={slug} slug={slug} scheme={catalog.find((entry) => entry.slug === slug)} />
                ))
                : <TopicReply reply={replies[reply.topic]} />}
            </article>
          </div>
        ))}
      </div>
      <div className="chat-topics">
        {topics.map(({ key, label }) => (
          <button type="button" key={key} className="secondary-action"
            onClick={() => addReply(t(label), { topic: key })}>{t(label)}</button>
        ))}
      </div>
      <details className="card eligibility-form match-section">
        <summary>{t('schemes')}</summary>
        <div className="chat-topics">
          {Object.keys(schemeQuestions).map((slug) => (
            <button type="button" className="secondary-action" key={slug}
              onClick={() => addReply(schemeTitle(lang, slug), { schemes: [slug] })}>{schemeTitle(lang, slug)}</button>
          ))}
        </div>
      </details>
      <form className="form eligibility-form chat-form" onSubmit={sendQuestion}>
        <label>
          {t('chatQuestion')}
          <textarea ref={composer} dir="auto" rows={3} maxLength={240} value={question}
            onChange={(event) => setQuestion(event.target.value)} />
        </label>
        <button type="submit" disabled={!question.trim()}>{t('chatSend')}</button>
      </form>
      {user && <p><Link to="/my-schemes">{t('findSchemes')}</Link></p>}
    </main>
  );
}

function TopicReply({ reply }) {
  const { t } = useLang();
  return (
    <>
      {reply.text === 'helpApplyAnswer' ? (
        <>
          <TranslationNotice />
          <p lang="en" dir="ltr">{getText('en', reply.text)}</p>
        </>
      ) : <p>{t(reply.text)}</p>}
      {reply.links.length > 0 && <ul>{reply.links.map(([path, key]) => (
        <li key={path}><Link to={path}>{t(key)}</Link></li>
      ))}</ul>}
    </>
  );
}

function SchemeReply({ scheme, slug }) {
  const { lang, t } = useLang();
  return (
    <section>
      <h2>{schemeTitle(lang, slug)}</h2>
      {scheme && (
        <>
          <TranslationNotice />
          <p lang="en" dir="ltr">{localizedScheme(scheme, 'summary', lang)}</p>
        </>
      )}
      <ul>
        <li><Link to={`/eligibility?scheme=${encodeURIComponent(slug)}`}>{t('eligibility')}</Link></li>
        {scheme && /^https:\/\//i.test(scheme.sourceUrl) && (
          <li><a href={scheme.sourceUrl} target="_blank" rel="noreferrer">{t('officialScheme')}</a></li>
        )}
        <li><Link to={scheme?._id ? `/schemes/${scheme._id}` : '/schemes'}>
          {scheme?._id ? localizedScheme(scheme, 'title', lang) : t('browse')}
        </Link></li>
      </ul>
    </section>
  );
}
