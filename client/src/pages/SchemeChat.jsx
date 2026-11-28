import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { schemeQuestions } from '../eligibilityContent';
import { helpReply, helpTopics, unknownAnswer } from '../helpTopics';
import { getText } from '../locales';
import { localizedScheme, schemePath, stateLabel } from '../schemeText';
import { createSchemeSearch } from '../schemeSearch';
import TranslationNotice from '../TranslationNotice';
import { useAuth } from '../useAuth';
import { useLang } from '../useLang';

export default function SchemeChat() {
  const [params] = useSearchParams();
  const initialTopic = params.get('topic');
  return <ChatPanel key={initialTopic} initialTopic={initialTopic} />;
}

function ChatPanel({ initialTopic }) {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const search = useMemo(() => createSchemeSearch(catalog, lang, t), [catalog, lang, t]);
  const [messages, setMessages] = useState(() => {
    return Object.hasOwn(helpTopics, initialTopic)
      ? [{ label: helpTopics[initialTopic].label, reply: { topic: initialTopic } }] : [];
  });
  const [question, setQuestion] = useState('');
  const composer = useRef(null);
  const [announcedReply, setAnnouncedReply] = useState(null);
  const announcementKey = helpTopics[announcedReply?.topic]?.text;
  const announcementLang = announcedReply?.schemes || announcedReply?.topic === 'fallback'
    || announcementKey === 'helpApplyAnswer' ? 'en' : lang;
  const announcement = announcedReply?.schemes
    ? [announcedReply.unsure ? unknownAnswer : '', ...announcedReply.schemes
      .map((scheme) => localizedScheme(scheme, 'title', 'en'))].filter(Boolean).join(' ')
    : announcementKey ? getText(announcementLang, announcementKey) : announcedReply ? unknownAnswer : '';

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
      addReply(message, helpReply(message, t, search));
      composer.current?.focus();
    }
  }

  return (
    <main className="page">
      <h1>{t('schemeChat')}</h1>
      <p>{t('chatIntro')}</p>
      <div className="sr-only" role="status" lang={announcementLang}>
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
              {reply.schemes ? (
                <>
                  {reply.unsure && <p lang="en" dir="ltr">{unknownAnswer}</p>}
                  {reply.schemes.map((scheme) => <SchemeReply key={scheme.slug} scheme={scheme} />)}
                  {reply.suggested && <p><Link to={'/schemes?' + new URLSearchParams({
                    suggested: reply.suggested.join(','),
                  })}>{t('browse')}</Link></p>}
                  <TranslationNotice />
                  <p lang="en" dir="ltr">{getText('en', 'disclaimer')}</p>
                </>
              ) : <TopicReply topic={reply.topic} />}
            </article>
          </div>
        ))}
      </div>
      <div className="chat-topics">
        {Object.entries(helpTopics).map(([key, { label }]) => (
          <button type="button" key={key} className="secondary-action"
            onClick={() => addReply(t(label), { topic: key })}>{t(label)}</button>
        ))}
      </div>
      <details className="card eligibility-form match-section">
        <summary>{t('schemes')}</summary>
        <div className="chat-topics">
          {Object.keys(schemeQuestions).map((slug) => catalog.find((scheme) => scheme.slug === slug))
            .filter(Boolean).map((scheme) => (
              <button type="button" className="secondary-action" key={scheme.slug}
                onClick={() => addReply(localizedScheme(scheme, 'title', lang), { schemes: [scheme], named: true })}>
                {localizedScheme(scheme, 'title', lang)}
              </button>
            ))}
        </div>
      </details>
      <form className="form eligibility-form chat-form" onSubmit={sendQuestion}>
        <label>
          {t('chatQuestion')}
          <textarea ref={composer} dir="auto" rows={3} maxLength={240} autoComplete="off" value={question}
            onChange={(event) => setQuestion(event.target.value)} />
        </label>
        <button type="submit" disabled={!question.trim()}>{t('chatSend')}</button>
      </form>
      {user && <p><Link to="/my-schemes">{t('findSchemes')}</Link></p>}
    </main>
  );
}

function TopicReply({ topic }) {
  const { t } = useLang();
  if (topic === 'fallback') return (
    <>
      <TranslationNotice />
      <p lang="en" dir="ltr">{unknownAnswer}</p>
      <p lang="en" dir="ltr">{getText('en', 'disclaimer')}</p>
      <p><Link to="/schemes">{t('browse')}</Link></p>
    </>
  );
  const reply = helpTopics[topic];
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

function SchemeReply({ scheme }) {
  const { lang, t } = useLang();
  const title = localizedScheme(scheme, 'title', lang);
  const region = scheme.state || (scheme.level === 'central' ? 'All India' : '');
  return (
    <section>
      <h2>{title}</h2>
      {region && <p>{stateLabel(region, t)}</p>}
      <ul>
        {Object.hasOwn(schemeQuestions, scheme.slug) && (
          <li><Link to={`/eligibility?scheme=${encodeURIComponent(scheme.slug)}`}>{t('eligibility')}</Link></li>
        )}
        {/^https:\/\//i.test(scheme.sourceUrl) && (
          <li><a href={scheme.sourceUrl} target="_blank" rel="noreferrer">{t('officialScheme')}</a></li>
        )}
        <li><Link to={schemePath(scheme)}>{title}</Link></li>
      </ul>
    </section>
  );
}
