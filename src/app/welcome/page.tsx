'use client';

import React from 'react';
import {
  User,
  TextT,
  Phone,
  Envelope,
  Globe,
  GraduationCap,
  Megaphone,
  HandsPraying,
  Heart,
  CaretRight,
  CheckCircle,
} from '@phosphor-icons/react';
import { createClient } from '@/utils/supabase/client';
import { REFERRAL_SOURCES, INTERESTS, type ReferralSource, type Interest } from '@/lib/types';
import { TextInputRow, TextareaRow, PickerRow } from '@/components/form';
import { rowBtnStyle, spacerStyle, labelStyle } from '@/components/form/formStyles';
import LanguagePickerSheet from '@/components/LanguagePickerSheet';
import { Logo } from '@/components/Logo';
import PickerMenu from '@/components/PickerMenu';
import { ToggleSwitch } from '@/components/ToggleSwitch';

const REFERRAL_LABELS: Record<ReferralSource, string> = {
  flyer: 'Flyer',
  online: 'Online',
  'drive-by': 'Drive-by',
  school: 'School',
  friend: 'Friend',
  other: 'Other',
};

const INTEREST_LABELS: Record<Interest, string> = {
  salvation: 'Salvation',
  growth: 'Growth in Christ',
  serving: 'Serving',
  'small-groups': 'Small Groups',
};

export default function WelcomePage() {
  const [preferredName, setPreferredName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [isStudent, setIsStudent] = React.useState(false);
  const [languages, setLanguages] = React.useState<string[]>(['English']);
  const [referralSource, setReferralSource] = React.useState<ReferralSource | ''>('');
  const [referralDetail, setReferralDetail] = React.useState('');
  const [prayerRequest, setPrayerRequest] = React.useState('');
  const [interests, setInterests] = React.useState<Interest[]>([]);
  const [honeypot, setHoneypot] = React.useState('');

  const [showLanguagePicker, setShowLanguagePicker] = React.useState(false);
  const [showSourcePicker, setShowSourcePicker] = React.useState(false);
  const sourceBtnRef = React.useRef<HTMLButtonElement>(null);

  const firstNameRef = React.useRef<HTMLInputElement>(null);
  const lastNameRef = React.useRef<HTMLInputElement>(null);
  const phoneRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const referralDetailRef = React.useRef<HTMLInputElement>(null);
  const prayerRef = React.useRef<HTMLTextAreaElement>(null);

  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSubmit = preferredName.trim().length > 0 && !submitting;
  const showReferralDetail = referralSource === 'friend' || referralSource === 'other';

  const toggleInterest = (interest: Interest) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (honeypot.trim().length > 0) {
      setDone(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase.from('visitor_submissions').insert({
      source: 'qr',
      status: 'pending',
      person_id: null,
      submitted_by: null,
      preferred_name: preferredName.trim(),
      last_name: lastName.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      is_student: isStudent,
      languages: languages.length > 0 ? languages : ['English'],
      referral_source: referralSource || null,
      referral_detail: referralDetail.trim() || null,
      interests,
      prayer_request: prayerRequest.trim() || null,
    });
    setSubmitting(false);
    if (insertError) {
      setError(
        "Sorry, we couldn't submit your card. Please try again or talk to a Welcome Team member."
      );
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem 1.25rem',
          gap: 16,
        }}
      >
        <Logo height={88} />
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--sage-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircle size={36} color="var(--sage)" weight="fill" />
        </div>
        <h1
          className="font-display"
          style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}
        >
          Thank you for visiting!
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 320 }}>
          We've got your card. Someone from our Welcome Team will reach out to you soon. We're so
          glad you're here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 24, paddingBottom: 48 }}>
      <header style={{ textAlign: 'center', marginBottom: 24 }}>
        <Logo height={96} style={{ margin: '0 auto 16px' }} />
        <h1
          className="font-display"
          style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}
        >
          Welcome!
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          We'd love to get to know you. Fill out this card so we can stay in touch.
        </p>
      </header>

      <input
        type="text"
        name="company"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />

      <Section label="Your name">
        <TextInputRow
          icon={<User size={16} color="var(--text-muted)" />}
          label="Preferred"
          required
          inputRef={firstNameRef}
          value={preferredName}
          onChange={setPreferredName}
          autoComplete="given-name"
        />
        <TextInputRow
          icon={<TextT size={16} color="var(--text-muted)" />}
          label="Last"
          inputRef={lastNameRef}
          value={lastName}
          onChange={setLastName}
          autoComplete="family-name"
        />
      </Section>

      <Section label="How can we reach you?">
        <TextInputRow
          icon={<Phone size={16} color="var(--text-muted)" />}
          label="Phone"
          inputRef={phoneRef}
          value={phone}
          onChange={setPhone}
          type="tel"
          autoComplete="tel"
        />
        <p style={consentNoteStyle}>
          By providing your phone number, you agree for a member or group leader to contact you.
        </p>
        <TextInputRow
          icon={<Envelope size={16} color="var(--text-muted)" />}
          label="Email"
          inputRef={emailRef}
          value={email}
          onChange={setEmail}
          type="email"
          autoComplete="email"
        />
      </Section>

      <Section label="A bit about you">
        <div style={toggleRowStyle}>
          <span style={spacerStyle} />
          <GraduationCap size={16} color="var(--text-muted)" />
          <span style={labelStyle}>I'm a student</span>
          <div style={{ flex: 1 }} />
          <ToggleSwitch checked={isStudent} onChange={setIsStudent} label="Student" />
        </div>
        <button
          className="field-row-hover"
          onClick={() => setShowLanguagePicker(true)}
          style={rowBtnStyle}
        >
          <span style={spacerStyle} />
          <Globe size={16} color="var(--text-muted)" />
          <span style={labelStyle}>Language</span>
          <span
            style={{
              flex: 1,
              fontSize: 14,
              textAlign: 'left',
              color: languages.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            {languages.length > 0 ? languages.join(', ') : 'None'}
          </span>
          <CaretRight size={14} color="var(--text-muted)" />
        </button>
      </Section>

      <Section label="How did you hear about us?">
        <PickerRow
          ref={sourceBtnRef}
          icon={<Megaphone size={16} color="var(--text-muted)" />}
          label="Heard via"
          value={referralSource ? REFERRAL_LABELS[referralSource] : 'Select'}
          onClick={() => setShowSourcePicker(true)}
        />
        {showReferralDetail && (
          <TextInputRow
            icon={<TextT size={16} color="var(--text-muted)" />}
            label={referralSource === 'friend' ? "Friend's name" : 'Details'}
            inputRef={referralDetailRef}
            value={referralDetail}
            onChange={setReferralDetail}
            placeholder={referralSource === 'friend' ? 'Who invited you?' : 'Tell us more'}
          />
        )}
      </Section>

      <Section label="How can we pray for you?">
        <TextareaRow
          icon={<HandsPraying size={16} color="var(--text-muted)" />}
          label="Prayer"
          inputRef={prayerRef}
          value={prayerRequest}
          onChange={setPrayerRequest}
          rows={4}
          resizable
          placeholder="Share anything you'd like prayer for"
        />
      </Section>

      <Section label="I'm interested in">
        {INTERESTS.map((interest) => {
          const selected = interests.includes(interest);
          return (
            <button
              key={interest}
              className="field-row-hover"
              onClick={() => toggleInterest(interest)}
              style={rowBtnStyle}
            >
              <span style={spacerStyle} />
              <Heart
                size={16}
                color={selected ? 'var(--sage)' : 'var(--text-muted)'}
                weight={selected ? 'fill' : 'regular'}
              />
              <span
                style={{ ...labelStyle, color: 'var(--text-primary)', flex: 1, textAlign: 'left' }}
              >
                {INTEREST_LABELS[interest]}
              </span>
              {selected && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '0.125rem 0.5rem',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--sage)',
                    color: 'var(--on-sage)',
                  }}
                >
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </Section>

      {error && (
        <p
          style={{
            background: 'var(--red-light, #fee2e2)',
            color: 'var(--red, #b91c1c)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius)',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: '100%',
          padding: '0.875rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background: canSubmit ? 'var(--sage)' : 'var(--border)',
          color: canSubmit ? 'var(--on-sage)' : 'var(--text-muted)',
          fontSize: 16,
          fontWeight: 600,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {submitting ? 'Submitting…' : 'Submit'}
      </button>

      {showLanguagePicker && (
        <LanguagePickerSheet
          currentLanguages={languages}
          onConfirm={(langs) => {
            setLanguages(langs);
            setShowLanguagePicker(false);
          }}
          onBack={() => setShowLanguagePicker(false)}
        />
      )}
      {showSourcePicker && (
        <PickerMenu
          anchorRef={sourceBtnRef}
          title="How did you hear about us?"
          value={referralSource}
          options={REFERRAL_SOURCES.map((s) => ({ value: s, label: REFERRAL_LABELS[s] }))}
          onSelect={(v) => {
            setReferralSource(v as ReferralSource);
            setShowSourcePicker(false);
          }}
          onClose={() => setShowSourcePicker(false)}
        />
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 6,
        }}
      >
        {label}
      </p>
      <div
        className="no-last-border"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
          padding: '0 1.25rem',
        }}
      >
        {children}
      </div>
    </div>
  );
}

const toggleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  paddingTop: 12,
  paddingBottom: 12,
  paddingRight: 16,
  borderBottom: '1px solid var(--border-light)',
};

const consentNoteStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  padding: '0.5rem 0 0.75rem 32px',
  margin: 0,
  lineHeight: 1.4,
  borderBottom: '1px solid var(--border-light)',
};
