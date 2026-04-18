'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass, Check } from '@phosphor-icons/react';

const PRIORITY_LANGUAGES = ['English', 'Mandarin Chinese', 'Cantonese', 'Spanish'];

const OTHER_LANGUAGES = [
  'Arabic', 'Bengali', 'Bulgarian', 'Croatian', 'Czech', 'Danish', 'Dutch',
  'Filipino (Tagalog)', 'Finnish', 'French', 'German', 'Greek', 'Gujarati',
  'Hebrew', 'Hindi', 'Hungarian', 'Indonesian', 'Italian', 'Japanese',
  'Javanese', 'Kannada', 'Kazakh', 'Korean', 'Malay', 'Marathi', 'Nepali',
  'Niue', 'Norwegian', 'Persian (Farsi)', 'Polish', 'Portuguese', 'Punjabi',
  'Romanian', 'Russian', 'Serbian', 'Sinhala', 'Slovak', 'Slovenian',
  'Swahili', 'Swedish', 'Tamil', 'Telugu', 'Thai', 'Turkish', 'Ukrainian',
  'Urdu', 'Vietnamese', 'Yoruba', 'Zulu',
];

interface Props {
  currentLanguages: string[];
  onConfirm: (languages: string[]) => void;
  onBack: () => void;
}

export default function LanguagePickerSheet({ currentLanguages, onConfirm, onBack }: Props) {
  const [selected, setSelected] = useState<string[]>(currentLanguages);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const q = search.toLowerCase().trim();

  const toggle = (lang: string) =>
    setSelected((prev) => prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]);

  const filteredPriority = q ? PRIORITY_LANGUAGES.filter((l) => l.toLowerCase().includes(q)) : PRIORITY_LANGUAGES;
  const filteredOther = OTHER_LANGUAGES.filter((l) => !q || l.toLowerCase().includes(q));

  const doneLabel = selected.length > 0 ? `Done (${selected.length})` : 'Done';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(30,26,24,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div
        className="animate-slide-up"
        style={{
          background: 'var(--surface)', borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 430,
          height: 'calc(100dvh - 48px)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '14px auto 0', flexShrink: 0 }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px', flexShrink: 0, borderBottom: '1px solid var(--border-light)' }}>
          <button onClick={onBack} style={{ fontSize: 14, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Back</button>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Languages</span>
          <button onClick={() => onConfirm(selected)} style={{ fontSize: 14, fontWeight: 600, color: 'var(--sage)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {doneLabel}
          </button>
        </div>

        <div style={{ padding: '12px 20px', flexShrink: 0, borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px' }}>
            <MagnifyingGlass size={14} color="var(--text-muted)" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search languages…"
              style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', background: 'none', border: 'none', outline: 'none' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Priority languages */}
          {filteredPriority.length > 0 && (
            <>
              {!q && (
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 20px 6px', margin: 0 }}>
                  Suggested
                </p>
              )}
              {filteredPriority.map((lang) => <LanguageRow key={lang} lang={lang} selected={selected} onToggle={toggle} />)}
            </>
          )}

          {/* Other languages */}
          {filteredOther.length > 0 && (
            <>
              {!q && filteredPriority.length > 0 && (
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 20px 6px', margin: 0, borderTop: '1px solid var(--border-light)' }}>
                  All Languages
                </p>
              )}
              {filteredOther.map((lang) => <LanguageRow key={lang} lang={lang} selected={selected} onToggle={toggle} />)}
            </>
          )}

          {filteredPriority.length === 0 && filteredOther.length === 0 && (
            <p style={{ padding: '24px 20px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>No languages found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function LanguageRow({ lang, selected, onToggle }: { lang: string; selected: string[]; onToggle: (l: string) => void }) {
  const isSel = selected.includes(lang);
  return (
    <button
      onClick={() => onToggle(lang)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 20px',
        background: isSel ? 'var(--sage-light)' : 'none',
        border: 'none', borderBottom: '1px solid var(--border-light)',
        cursor: 'pointer', textAlign: 'left' as const,
      }}
    >
      <span style={{ flex: 1, fontSize: 14, fontWeight: isSel ? 600 : 400, color: isSel ? 'var(--sage)' : 'var(--text-primary)' }}>{lang}</span>
      <div style={{
        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
        border: isSel ? 'none' : '1.5px solid var(--border)',
        background: isSel ? 'var(--sage)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
      }}>
        {isSel && <Check size={11} color="#fff" weight="bold" />}
      </div>
    </button>
  );
}
