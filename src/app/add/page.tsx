'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { type MembershipStatus, type ChurchAttendance } from '@/lib/types';
import { Check } from '@phosphor-icons/react';

export default function AddPage() {
  const { addPerson } = useApp();
  const router = useRouter();
  const [englishName, setEnglishName] = useState('');
  const [chineseName, setChineseName] = useState('');
  const [phone, setPhone] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!englishName.trim()) return;
    addPerson({
      englishName: englishName.trim(),
      chineseName: chineseName.trim() || undefined,
      phone: phone.trim() || undefined,
      membershipStatus: 'non-member' as MembershipStatus,
      churchAttendance: (isFirstTime ? 'first-time-visitor' : 'regular') as ChurchAttendance,
      language: ['English'],
      isFirstTimeVisitor: isFirstTime,
    });
    setSubmitted(true);
    setTimeout(() => router.push('/'), 1600);
  };

  if (submitted) {
    return (
      <div style={{ paddingTop: 80, textAlign: 'center' }}>
        <div
          className="animate-check-in"
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--sage-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Check size={28} color="var(--sage)" weight="bold" />
        </div>
        <h2
          style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}
        >
          Person Added
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          {englishName} has been added to the directory.
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 24, paddingBottom: 40 }}>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 4,
          letterSpacing: '-0.02em',
        }}
      >
        Add New Person
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        Welcome team — add a visitor or new attendee
      </p>

      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-card)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {/* English name */}
        <FormField label="English Name" required>
          <input
            type="text"
            value={englishName}
            onChange={(e) => setEnglishName(e.target.value)}
            placeholder="Full name"
            style={inputStyle}
          />
        </FormField>

        {/* Chinese name */}
        <FormField label="Chinese Name">
          <input
            type="text"
            value={chineseName}
            onChange={(e) => setChineseName(e.target.value)}
            placeholder="中文名字 (optional)"
            style={inputStyle}
          />
        </FormField>

        {/* Phone */}
        <FormField label="Phone">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number (optional)"
            style={inputStyle}
          />
        </FormField>

        {/* First-time toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'var(--bg)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-light)',
          }}
        >
          <div>
            <p
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: 2,
              }}
            >
              First-time visitor
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Mark if this is their first visit
            </p>
          </div>
          <button
            onClick={() => setIsFirstTime(!isFirstTime)}
            style={{
              width: 48,
              height: 28,
              borderRadius: '999px',
              background: isFirstTime ? 'var(--sage)' : '#D8D4D0',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s ease',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                background: '#fff',
                borderRadius: '50%',
                position: 'absolute',
                top: 3,
                left: isFirstTime ? 23 : 3,
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </button>
        </div>

        {/* Notes */}
        <FormField label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this person…"
            rows={3}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
          />
        </FormField>

        <button
          onClick={handleSubmit}
          disabled={!englishName.trim()}
          style={{
            width: '100%',
            background: englishName.trim() ? 'var(--sage)' : '#C8C4C0',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius)',
            padding: '13px 0',
            fontSize: 15,
            fontWeight: 600,
            cursor: englishName.trim() ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s ease',
          }}
        >
          Add Person
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '11px 13px',
  fontSize: 14,
  color: 'var(--text-primary)',
  background: 'var(--bg)',
  outline: 'none',
};

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 7,
        }}
      >
        {label} {required && <span style={{ color: 'var(--red)' }}>*</span>}
      </label>
      {children}
    </div>
  );
}
