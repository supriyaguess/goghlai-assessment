import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { SendIcon } from './icons';

const MAX_LENGTH = 4000;
const SHOW_COUNTER = MAX_LENGTH * 0.8;
const WARN_COUNTER = MAX_LENGTH * 0.9;

interface Props {
  onSend: (text: string) => void;
  disabledReason?: string;
}

export function ReplyBox({ onSend, disabledReason }: Props) {
  const [text, setText] = useState('');
  const field = useRef<HTMLTextAreaElement>(null);
  const trimmed = text.trim();
  const over = text.length > MAX_LENGTH;
  const disabled = Boolean(disabledReason);

  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  function send() {
    if (!trimmed || over || disabled) return;
    onSend(trimmed);
    setText('');
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  }

  const sendBlocked = disabled || !trimmed || over;
  const sendReason = disabledReason ?? (over ? `Messages can be up to ${MAX_LENGTH} characters` : !trimmed ? 'Type a message to send' : undefined);
  const counterTone = over ? 'danger' : text.length >= WARN_COUNTER ? 'warning' : '';

  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <div className={`composer-card${disabled ? ' is-disabled' : ''}`}>
        {disabledReason && <p className="composer-reason">{disabledReason}</p>}
        <label htmlFor="reply-text" className="visually-hidden">Reply</label>
        <textarea
          id="reply-text"
          ref={field}
          value={text}
          rows={1}
          disabled={disabled}
          placeholder="Write a reply"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="composer-foot">
          <span className="composer-hint">Enter to send, Shift+Enter for a new line</span>
          {text.length >= SHOW_COUNTER && (
            <span className={`composer-count ${counterTone}`}>{text.length} / {MAX_LENGTH}</span>
          )}
          <button className="btn btn-primary btn-send" type="submit" disabled={sendBlocked} title={sendReason}>
            <SendIcon size={16} />
            <span className="visually-hidden">Send</span>
          </button>
        </div>
      </div>
    </form>
  );
}
