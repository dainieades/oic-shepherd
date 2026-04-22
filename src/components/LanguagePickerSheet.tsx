'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass, Check } from '@phosphor-icons/react';
import { Z_SHEET } from '@/lib/constants';
import { BottomSheet, ModalHeader } from '@/components/BottomSheet';

const PRIORITY_LANGUAGES = ['English', 'Mandarin Chinese', 'Cantonese', 'Spanish'];

const OTHER_LANGUAGES = [
  'Arabic',
  'Bengali',
  'Bulgarian',
  'Croatian',
  'Czech',
  'Danish',
  'Dutch',
  'Filipino (Tagalog)',
  'Finnish',
  'French',
  'German',
  'Greek',
  'Gujarati',
  'Hebrew',
  'Hindi',
  'Hungarian',
  'Indonesian',
  'Italian',
  'Japanese',
  'Javanese',
  'Kannada',
  'Kazakh',
  'Korean',
  'Malay',
  'Marathi',
  'Nepali',
  'Niue',
  'Norwegian',
  'Persian (Farsi)',
  'Polish',
  'Portuguese',
  'Punjabi',
  'Romanian',
  'Russian',
  'Serbian',
  'Sinhala',
  'Slovak',
  'Slovenian',
  'Swahili',
  'Swedish',
  'Tamil',
  'Telugu',
  'Thai',
  'Turkish',
  'Ukrainian',
  'Urdu',
  'Vietnamese',
  'Yoruba',
  'Zulu',
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

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const q = search.toLowerCase().trim();

  const toggle = (lang: string) =>
    setSelected((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));

  const filteredPriority = q
    ? PRIORITY_LANGUAGES.filter((l) => l.toLowerCase().includes(q))
    : PRIORITY_LANGUAGES;
  const filteredOther = OTHER_LANGUAGES.filter((l) => !q || l.toLowerCase().includes(q));

  const doneLabel = selected.length > 0 ? `Done (${selected.length})` : 'Done';

  return (
    <BottomSheet onClose={onBack} zIndex={Z_SHEET}>
      <ModalHeader
        title="Languages"
        onCancel={onBack}
        cancelLabel="Back"
        onAction={() => onConfirm(selected)}
        actionLabel={doneLabel}
        actionVariant="text"
      />

        <div
          style={{
            padding: '0.75rem 1.25rem',
            flexShrink: 0,
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5625rem 0.75rem',
            }}
          >
            <MagnifyingGlass size={14} color="var(--text-muted)" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search languages…"
              style={{
                flex: 1,
                fontSize: 14,
                color: 'var(--text-primary)',
                background: 'none',
                border: 'none',
                outline: 'none',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Priority languages */}
          {filteredPriority.length > 0 && (
            <>
              {!q && (
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '0.75rem 1.25rem 0.375rem',
                    margin: 0,
                  }}
                >
                  Suggested
                </p>
              )}
              {filteredPriority.map((lang) => (
                <LanguageRow key={lang} lang={lang} selected={selected} onToggle={toggle} />
              ))}
            </>
          )}

          {/* Other languages */}
          {filteredOther.length > 0 && (
            <>
              {!q && filteredPriority.length > 0 && (
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '0.75rem 1.25rem 0.375rem',
                    margin: 0,
                    borderTop: '1px solid var(--border-light)',
                  }}
                >
                  All Languages
                </p>
              )}
              {filteredOther.map((lang) => (
                <LanguageRow key={lang} lang={lang} selected={selected} onToggle={toggle} />
              ))}
            </>
          )}

          {filteredPriority.length === 0 && filteredOther.length === 0 && (
            <p
              style={{
                padding: '1.5rem 1.25rem',
                fontSize: 13,
                color: 'var(--text-muted)',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              No languages found.
            </p>
          )}
        </div>
    </BottomSheet>
  );
}

function LanguageRow({
  lang,
  selected,
  onToggle,
}: {
  lang: string;
  selected: string[];
  onToggle: (l: string) => void;
}) {
  const isSel = selected.includes(lang);
  return (
    <button
      onClick={() => onToggle(lang)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0.75rem 1.25rem',
        background: isSel ? 'var(--sage-light)' : 'none',
        border: 'none',
        borderBottom: '1px solid var(--border-light)',
        cursor: 'pointer',
        textAlign: 'left' as const,
      }}
    >
      <span
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: isSel ? 600 : 400,
          color: isSel ? 'var(--sage)' : 'var(--text-primary)',
        }}
      >
        {lang}
      </span>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          flexShrink: 0,
          border: isSel ? 'none' : '0.09375rem solid var(--border)',
          background: isSel ? 'var(--sage)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.15s',
        }}
      >
        {isSel && <Check size={11} color="var(--on-sage)" weight="bold" />}
      </div>
    </button>
  );
}
