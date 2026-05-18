'use client';

import React from 'react';
import {
  User,
  TextT,
  Phone,
  Envelope,
  Globe,
  Users,
  Megaphone,
  HandsPraying,
  Heart,
  CaretRight,
} from '@phosphor-icons/react';
import {
  REFERRAL_SOURCES,
  INTERESTS,
  LIFE_STAGE_OPTIONS,
  type ReferralSource,
  type Interest,
  type VisitorIntakeValues,
} from '@/lib/types';
import { TextInputRow, TextareaRow, PickerRow } from '@/components/form';
import { rowBtnStyle, spacerStyle, labelStyle } from '@/components/form/formStyles';
import LanguagePickerSheet from './LanguagePickerSheet';
import PickerMenu from './PickerMenu';
import { BottomSheet } from '@/components/BottomSheet';

export interface VisitorIntakeFormHandle {
  save: () => Promise<void>;
}

export type { VisitorIntakeValues };

interface Props {
  onSubmit: (values: VisitorIntakeValues) => Promise<void>;
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
  function VisitorIntakeForm({ onSubmit, onValidityChange }, ref) {
    const [preferredName, setPreferredName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    const [alternativeName, setAlternativeName] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [lifeStage, setLifeStage] = React.useState<string[]>([]);
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
    const altNameRef = React.useRef<HTMLInputElement>(null);
    const phoneRef = React.useRef<HTMLInputElement>(null);
    const emailRef = React.useRef<HTMLInputElement>(null);
    const referralDetailRef = React.useRef<HTMLInputElement>(null);
    const prayerRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
      onValidityChange?.(preferredName.trim().length > 0);
    }, [preferredName, onValidityChange]);

    const toggleLifeStage = (option: string) => {
      setLifeStage((prev) =>
        prev.includes(option) ? prev.filter((s) => s !== option) : [...prev, option]
      );
    };

    const toggleInterest = (interest: Interest) => {
      setInterests((prev) =>
        prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
      );
    };

    const save = React.useCallback(async () => {
      const trimmedName = preferredName.trim();
      if (!trimmedName) return;
      await onSubmit({
        preferredName: trimmedName,
        lastName: lastName.trim() || undefined,
        alternativeName: alternativeName.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        lifeStage,
        languages: languages.length > 0 ? languages : ['English'],
        referralSource: referralSource || undefined,
        referralDetail: referralDetail.trim() || undefined,
        interests,
        prayerRequest: prayerRequest.trim() || undefined,
      });
    }, [
      preferredName,
      lastName,
      alternativeName,
      phone,
      email,
      lifeStage,
      languages,
      referralSource,
      referralDetail,
      interests,
      prayerRequest,
      onSubmit,
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
          <TextInputRow
            icon={<TextT size={16} color="var(--text-muted)" />}
            label="Alt. name"
            inputRef={altNameRef}
            value={alternativeName}
            onChange={setAlternativeName}
            placeholder="Legal name, 中文名…"
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
            autoComplete="tel"
          />
          <TextInputRow
            icon={<Envelope size={16} color="var(--text-muted)" />}
            label="Email"
            inputRef={emailRef}
            value={email}
            onChange={setEmail}
            type="email"
            autoComplete="email"
          />
          <p className="text-11 text-text-muted py-2 pb-3 pl-8 m-0 leading-comfortable">
            By sharing contact info, you consent to being reached out to by a member or group leader.
          </p>
        </Section>

        <Section label="About">
          <div className="pt-3 pb-[0.625rem] border-b border-border-light">
            <div className="flex items-center gap-1.5 mb-2">
              <Users size={16} color="var(--text-muted)" />
              <span className="text-13 font-medium text-text-secondary">
                Life stage
              </span>
              <span className="text-11 text-text-muted ml-1">
                Select all that apply
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {LIFE_STAGE_OPTIONS.map((option) => {
                const selected = lifeStage.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => toggleLifeStage(option)}
                    className="text-13 rounded-pill cursor-pointer transition-[background,color,border-color] duration-150"
                    style={{
                      fontWeight: selected ? 'var(--font-semibold)' : 'var(--font-normal)',
                      padding: '0.375rem 0.875rem',
                      border: `1px solid ${selected ? 'var(--sage)' : 'var(--border)'}`,
                      background: selected ? 'var(--sage)' : 'transparent',
                      color: selected ? 'var(--on-sage)' : 'var(--text-secondary)',
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
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
              className="flex-1 text-14 text-left"
              style={{
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
            onClick={() => setShowSourcePicker((v) => !v)}
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
                  <span className="text-11 font-bold py-0.5 px-2 rounded-pill bg-sage text-on-sage">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </Section>

        {showLanguagePicker && (
          <BottomSheet onClose={() => setShowLanguagePicker(false)}>
            <LanguagePickerSheet
              currentLanguages={languages}
              onConfirm={(langs) => {
                setLanguages(langs);
                setShowLanguagePicker(false);
              }}
              onBack={() => setShowLanguagePicker(false)}
            />
          </BottomSheet>
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
    <div className="mb-6">
      <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-1.5">
        {label}
      </p>
      <div
        className="no-last-border bg-surface rounded border border-border-light overflow-hidden px-5"
      >
        {children}
      </div>
    </div>
  );
}
