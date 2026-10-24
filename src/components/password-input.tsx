'use client';

import { useState, type ComponentProps } from 'react';

export function PasswordInput(props: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false);
  return <div className="password-field">
    <input {...props} type={visible ? 'text' : 'password'} />
    <button className="password-toggle" type="button" aria-controls={props.id}
      aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
      aria-pressed={visible} onClick={() => setVisible(value => !value)}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        {visible && <path d="m3 3 18 18" />}
      </svg>
    </button>
  </div>;
}
