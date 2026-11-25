import { useState, type KeyboardEvent } from 'react';

const MAX_LENGTH = 4000;

export function ReplyBox({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  const trimmed = text.trim();

  function send() {
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  }

  return (
    <form
      className="reply"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <label htmlFor="reply-text" className="visually-hidden">Reply</label>
      <textarea
        id="reply-text"
        value={text}
        maxLength={MAX_LENGTH}
        rows={2}
        placeholder="Write a reply. Enter sends, Shift+Enter adds a line."
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <button className="primary" type="submit" disabled={!trimmed}>Send</button>
    </form>
  );
}
