import { useEffect, useRef } from 'react';
import { feedbackId } from './formValidation';
import { useLang } from './useLang';

export default function FormFeedback({ feedback }) {
  const { t } = useLang();
  const summary = useRef(null);
  useEffect(() => {
    if (feedback) summary.current?.focus();
  }, [feedback]);

  if (!feedback) return null;
  const fields = Object.entries(feedback.fields ?? {}).filter(([, message]) => message);
  return (
    <div className="alert feedback account-feedback" id={feedbackId} ref={summary} tabIndex={-1}>
      <p>{t(feedback.key)}</p>
      {fields.length > 0 && (
        <ul>
          {fields.map(([name, message]) => (
            <li key={name}>
              <a href={`#${name}`} onClick={(event) => {
                event.preventDefault();
                document.getElementById(name)?.focus();
              }}>{t(name)}</a>
              <span id={`${feedbackId}-${name}`} dir="auto">{' · '}{message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
