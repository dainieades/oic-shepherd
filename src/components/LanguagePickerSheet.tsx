'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass, Check } from '@phosphor-icons/react';
import { SubPanel, ModalHeader } from '@/components/BottomSheet';

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
    <SubPanel onBack={onBack}>
      <ModalHeader
        title="Languages"
        onCancel={onBack}
        cancelLabel="Back"
        onAction={() => onConfirm(selected)}
        actionLabel={doneLabel}
        actionVariant="pill"
      />

      <div className="border-border-light shrink-0 border-b px-5 py-3">
        <div className="bg-bg border-border flex items-center gap-2 rounded-sm border px-3 py-[0.5625rem]">
          <MagnifyingGlass size={14} color="var(--text-muted)" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search languages…"
            className="text-14 text-text-primary flex-1 border-none bg-transparent outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-text-muted text-18 cursor-pointer border-none bg-transparent p-0 leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Priority languages */}
        {filteredPriority.length > 0 && (
          <>
            {!q && (
              <p className="text-10 text-text-muted tracking-wide-6 m-0 px-5 py-3 pb-[0.375rem] font-semibold uppercase">
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
              <p className="text-10 text-text-muted tracking-wide-6 border-border-light m-0 border-t px-5 py-3 pb-[0.375rem] font-semibold uppercase">
                All Languages
              </p>
            )}
            {filteredOther.map((lang) => (
              <LanguageRow key={lang} lang={lang} selected={selected} onToggle={toggle} />
            ))}
          </>
        )}

        {filteredPriority.length === 0 && filteredOther.length === 0 && (
          <p className="text-13 text-text-muted px-5 py-6 text-center italic">
            No languages found.
          </p>
        )}
      </div>
    </SubPanel>
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
      className="border-border-light flex w-full cursor-pointer items-center gap-3 border-b border-none px-5 py-3 text-left"
      style={{ background: isSel ? 'var(--sage-light)' : 'none' }}
    >
      <span
        className="text-14 flex-1"
        style={{
          fontWeight: isSel ? 'var(--font-semibold)' : 'var(--font-normal)',
          color: isSel ? 'var(--sage)' : 'var(--text-primary)',
        }}
      >
        {lang}
      </span>
      <div
        className="flex h-5 w-5 shrink-0 items-center justify-center transition-[background] duration-150"
        style={{
          borderRadius: 5,
          border: isSel ? 'none' : '0.09375rem solid var(--border)',
          background: isSel ? 'var(--sage)' : 'transparent',
        }}
      >
        {isSel && <Check size={11} color="var(--on-sage)" weight="bold" />}
      </div>
    </button>
  );
}
