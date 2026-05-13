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
} from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { REFERRAL_SOURCES, INTERESTS, type ReferralSource, type Interest } from '@/lib/types';
import { TextInputRow, TextareaRow, PickerRow } from '@/components/form';
import { rowBtnStyle, spacerStyle, labelStyle } from '@/components/form/formStyles';
import LanguagePickerSheet from './LanguagePickerSheet';
import PickerMenu from './PickerMenu';
import { ToggleSwitch } from './ToggleSwitch';

export interface VisitorIntakeFormHandle {
  save: () => Promise<void>;
}

interface Props {
  onSaved: (personId: string) => void;
  onValidityChange?: (valid: boolean) => void;
}

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

const VisitorIntakeForm = React.forwardRef<VisitorIntakeFormHandle, Props>(
  function VisitorIntakeForm({ onSaved, onValidityChange }, ref) {
    const { submitVisitorIntake } = useApp();

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

    const [showLanguagePicker, setShowLanguagePicker] = React.useState(false);
    const [showSourcePicker, setShowSourcePicker] = React.useState(false);
    const sourceBtnRef = React.useRef<HTMLButtonElement>(null);

    const firstNameRef = React.useRef<HTMLInputElement>(null);
    const lastNameRef = React.useRef<HTMLInputElement>(null);
    const phoneRef = React.useRef<HTMLInputElement>(null);
    const emailRef = React.useRef<HTMLInputElement>(null);
    const referralDetailRef = React.useRef<HTMLInputElement>(null);
    const prayerRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
      onValidityChange?.(preferredName.trim().length > 0);
    }, [preferredName, onValidityChange]);

    const toggleInterest = (interest: Interest) => {
      setInterests((prev) =>
        prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
      );
    };

    const save = React.useCallback(async () => {
      const trimmedName = preferredName.trim();
      if (!trimmedName) return;
      const { personId } = await submitVisitorIntake({
        preferredName: trimmedName,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        isStudent,
        languages: languages.length > 0 ? languages : ['English'],
        referralSource: referralSource || undefined,
        referralDetail: referralDetail.trim() || undefined,
        interests,
        prayerRequest: prayerRequest.trim() || undefined,
      });
      onSaved(personId);
    }, [
      preferredName,
      lastName,
      phone,
      email,
      isStudent,
      languages,
      referralSource,
      referralDetail,
      interests,
      prayerRequest,
      submitVisitorIntake,
      onSaved,
    ]);

    React.useImperativeHandle(ref, () => ({ save }), [save]);

    const showReferralDetail = referralSource === 'friend' || referralSource === 'other';

    return (
      <>
        <Section label="Name">
          <TextInputRow
            icon={<User size={16} color="var(--text-muted)" />}
            label="Preferred"
            required
            inputRef={firstNameRef}
            value={preferredName}
            onChange={setPreferredName}
          />
          <TextInputRow
            icon={<TextT size={16} color="var(--text-muted)" />}
            label="Last"
            inputRef={lastNameRef}
            value={lastName}
            onChange={setLastName}
          />
        </Section>

        <Section label="Contact">
          <TextInputRow
            icon={<Phone size={16} color="var(--text-muted)" />}
            label="Phone"
            inputRef={phoneRef}
            value={phone}
            onChange={setPhone}
            type="tel"
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
          />
        </Section>

        <Section label="About">
          <div className="field-row-hover" style={toggleRowStyle}>
            <span style={spacerStyle} />
            <GraduationCap size={16} color="var(--text-muted)" />
            <span style={labelStyle}>Student</span>
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
                  style={{
                    ...labelStyle,
                    color: 'var(--text-primary)',
                    flex: 1,
                    textAlign: 'left',
                  }}
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
      </>
    );
  }
);

export default VisitorIntakeForm;

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
