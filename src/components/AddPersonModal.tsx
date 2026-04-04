'use client';

import { useState, useRef } from 'react';
import {
  User, TextT, Globe, GenderIntersex, Cake, Heart, Sparkle, Church,
  IdentificationCard, CalendarCheck, Drop, Compass, Buildings,
  Phone, PhoneCall, Envelope, House, FirstAid, CaretRight,
} from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { formatPhone } from '@/lib/utils';
import { MembershipStatus, Language, Gender, MaritalStatus, CHURCH_POSITIONS } from '@/lib/types';
import PickerMenu from './PickerMenu';

interface AddPersonModalProps {
  onClose: () => void;
}

const MEMBERSHIP_OPTIONS: { value: MembershipStatus; label: string }[] = [
  { value: 'member',              label: 'Member' },
  { value: 'sunday-attendee',     label: 'Sunday attendee' },
  { value: 'fellowship-attendee', label: 'Fellowship attendee' },
  { value: 'membership-class',    label: 'Membership class' },
  { value: 'archive',             label: 'Archived' },
];

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'english',   label: 'English' },
  { value: 'chinese',   label: 'Chinese (Mandarin)' },
  { value: 'bilingual', label: 'Bilingual' },
];

const GENDER_OPTIONS: { value: Gender | ''; label: string }[] = [
  { value: '',       label: 'Not set' },
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
];

const MARITAL_OPTIONS: { value: MaritalStatus | ''; label: string }[] = [
  { value: '',         label: 'Not set' },
  { value: 'single',   label: 'Single' },
  { value: 'married',  label: 'Married' },
  { value: 'widowed',  label: 'Widowed' },
  { value: 'divorced', label: 'Divorced' },
];

function fmtDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AddPersonModal({ onClose }: AddPersonModalProps) {
  const { addPerson } = useApp();

  // Basic
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [chineseName, setChineseName] = useState('');

  // Personal
  const [language, setLanguage]           = useState<Language>('english');
  const [gender, setGender]               = useState<Gender | ''>('');
  const [birthday, setBirthday]           = useState('');
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus | ''>('');
  const [anniversary, setAnniversary]     = useState('');

  // Church
  const [status, setStatus]               = useState<MembershipStatus>('sunday-attendee');
  const [membershipDate, setMembershipDate] = useState('');
  const [baptismDate, setBaptismDate]     = useState('');
  const [isShepherd, setIsShepherd]       = useState(false);
  const [churchPositions, setChurchPositions] = useState<string[]>([]);

  // Contact
  const [phone, setPhone]           = useState('');
  const [homePhone, setHomePhone]   = useState('');
  const [email, setEmail]           = useState('');
  const [homeAddress, setHomeAddress] = useState('');

  // Notes
  const [spiritualNeeds, setSpiritualNeeds] = useState('');
  const [physicalNeeds, setPhysicalNeeds]   = useState('');

  // Text input refs
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef  = useRef<HTMLInputElement>(null);
  const chineseRef   = useRef<HTMLInputElement>(null);
  const phoneRef     = useRef<HTMLInputElement>(null);
  const homePhoneRef = useRef<HTMLInputElement>(null);
  const emailRef     = useRef<HTMLInputElement>(null);
  const addressRef   = useRef<HTMLTextAreaElement>(null);
  const spiritualRef = useRef<HTMLTextAreaElement>(null);
  const physicalRef  = useRef<HTMLTextAreaElement>(null);

  // Date input refs
  const birthdayRef       = useRef<HTMLInputElement>(null);
  const anniversaryRef    = useRef<HTMLInputElement>(null);
  const membershipDateRef = useRef<HTMLInputElement>(null);
  const baptismDateRef    = useRef<HTMLInputElement>(null);

  // Picker state
  const [openPicker, setOpenPicker] = useState<'status' | 'language' | 'gender' | 'marital' | null>(null);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

  const handleSave = () => {
    if (!firstName.trim()) return;
    addPerson({
      englishName: fullName,
      chineseName: chineseName.trim() || undefined,
      language,
      gender: gender || undefined,
      birthday: birthday || undefined,
      maritalStatus: maritalStatus || undefined,
      anniversary: (maritalStatus === 'married' && anniversary) ? anniversary : undefined,
      membershipStatus: status,
      membershipDate: (status === 'member' && membershipDate) ? membershipDate : undefined,
      baptismDate: baptismDate || undefined,
      isShepherd: isShepherd || undefined,
      churchPositions: churchPositions.length > 0 ? churchPositions : undefined,
      phone: phone.trim() || undefined,
      homePhone: homePhone.trim() || undefined,
      email: email.trim() || undefined,
      homeAddress: homeAddress.trim() || undefined,
      spiritualNeeds: spiritualNeeds.trim() || undefined,
      physicalNeeds: physicalNeeds.trim() || undefined,
    });
    setSubmitted(true);
    setTimeout(() => onClose(), 1600);
  };

  const togglePosition = (pos: string) => {
    setChurchPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    );
  };

  const statusLabel   = MEMBERSHIP_OPTIONS.find((o) => o.value === status)?.label ?? '';
  const languageLabel = LANGUAGE_OPTIONS.find((o) => o.value === language)?.label ?? '';
  const genderLabel   = GENDER_OPTIONS.find((o) => o.value === gender)?.label ?? 'Not set';
  const maritalLabel  = MARITAL_OPTIONS.find((o) => o.value === maritalStatus)?.label ?? 'Not set';

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(30,26,24,0.45)', zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="animate-slide-up"
          style={{
            background: 'var(--surface)', borderRadius: '20px 20px 0 0',
            width: '100%', maxWidth: 430,
            height: 'calc(100dvh - 48px)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* Drag handle */}
          <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '14px auto 0', flexShrink: 0 }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px', flexShrink: 0, borderBottom: '1px solid var(--border-light)' }}>
            <button onClick={onClose} style={{ fontSize: 14, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Add person</span>
            <button
              onClick={handleSave}
              disabled={!firstName.trim()}
              style={{ height: 32, padding: '0 14px', borderRadius: 8, background: firstName.trim() ? 'var(--sage)' : 'var(--border)', color: firstName.trim() ? '#fff' : 'var(--text-muted)', fontSize: 14, fontWeight: 600, border: 'none', cursor: firstName.trim() ? 'pointer' : 'default', transition: 'background 0.15s' }}
            >Save</button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 48px', background: 'var(--bg)' }}>
            {submitted ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--sage)" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Person added</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fullName} has been added to the directory.</p>
              </div>
            ) : (
              <>
                {/* ── BASIC ── */}
                <DrawerSection label="Basic">
                  <div className="field-row-hover" style={textRowStyle} onClick={() => firstNameRef.current?.focus()}>
                    <span style={asteriskStyle}>*</span>
                    <User size={16} color="var(--text-muted)" />
                    <span style={labelStyle}>Preferred</span>
                    <input ref={firstNameRef} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Preferred name" autoFocus style={inputStyle} />
                  </div>
                  <div className="field-row-hover" style={textRowStyle} onClick={() => lastNameRef.current?.focus()}>
                    <span style={spacerStyle} />
                    <User size={16} color="var(--text-muted)" style={{ opacity: 0 }} />
                    <span style={labelStyle}>Last</span>
                    <input ref={lastNameRef} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" style={inputStyle} />
                  </div>
                  <div className="field-row-hover" style={textRowStyle} onClick={() => chineseRef.current?.focus()}>
                    <span style={spacerStyle} />
                    <TextT size={16} color="var(--text-muted)" />
                    <span style={labelStyle}>Alt. name</span>
                    <input ref={chineseRef} value={chineseName} onChange={(e) => setChineseName(e.target.value)} placeholder="Legal name, 中文名…" style={inputStyle} />
                  </div>
                </DrawerSection>

                {/* ── PERSONAL ── */}
                <DrawerSection label="Personal">
                  <PickerRow icon={<Globe size={16} color="var(--text-muted)" />} label="Language" value={languageLabel} onClick={() => setOpenPicker('language')} />
                  <PickerRow icon={<GenderIntersex size={16} color="var(--text-muted)" />} label="Gender" value={genderLabel} onClick={() => setOpenPicker('gender')} />
                  <DateRow icon={<Cake size={16} color="var(--text-muted)" />} label="Birthday" value={birthday} inputRef={birthdayRef} onChange={setBirthday} />
                  <PickerRow icon={<Heart size={16} color="var(--text-muted)" />} label="Marital" value={maritalLabel} onClick={() => setOpenPicker('marital')} />
                  {maritalStatus === 'married' && (
                    <DateRow icon={<Sparkle size={16} color="var(--text-muted)" />} label="Anniversary" value={anniversary} inputRef={anniversaryRef} onChange={setAnniversary} />
                  )}
                </DrawerSection>

                {/* ── CHURCH ── */}
                <DrawerSection label="Church">
                  <PickerRow icon={<IdentificationCard size={16} color="var(--text-muted)" />} label="Status" value={statusLabel} onClick={() => setOpenPicker('status')} />
                  {status === 'member' && (
                    <DateRow icon={<CalendarCheck size={16} color="var(--text-muted)" />} label="Member Since" value={membershipDate} inputRef={membershipDateRef} onChange={setMembershipDate} />
                  )}
                  <DateRow icon={<Drop size={16} color="var(--text-muted)" />} label="Baptism" value={baptismDate} inputRef={baptismDateRef} onChange={setBaptismDate} />
                  <button
                    className="field-row-hover"
                    onClick={() => setIsShepherd((v) => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, paddingBottom: 12, border: 'none', borderBottom: '1px solid var(--border-light)', background: 'none', cursor: 'pointer', textAlign: 'left' as const }}
                  >
                    <span style={spacerStyle} />
                    <Compass size={16} color="var(--text-muted)" />
                    <span style={{ ...labelStyle, flex: 1 }}>Is Shepherd</span>
                    <div style={{ width: 42, height: 24, borderRadius: 12, flexShrink: 0, background: isShepherd ? 'var(--sage)' : 'var(--border)', position: 'relative', transition: 'background 0.2s' }}>
                      <div style={{ position: 'absolute', top: 3, left: isShepherd ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                    </div>
                  </button>
                  <button
                    className="field-row-hover"
                    onClick={() => setShowPositionPicker(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, paddingBottom: 12, border: 'none', borderBottom: '1px solid var(--border-light)', background: 'none', cursor: 'pointer', textAlign: 'left' as const }}
                  >
                    <span style={spacerStyle} />
                    <Buildings size={16} color="var(--text-muted)" />
                    <span style={labelStyle}>Position</span>
                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {churchPositions.length > 0
                        ? churchPositions.map((p) => (
                            <span key={p} style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: 'var(--sage-light)', color: 'var(--sage)', flexShrink: 0 }}>{p}</span>
                          ))
                        : <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>None</span>
                      }
                    </div>
                    <CaretRight size={14} color="var(--text-muted)" />
                  </button>
                </DrawerSection>

                {/* ── CONTACT ── */}
                <DrawerSection label="Contact">
                  <div className="field-row-hover" style={textRowStyle} onClick={() => phoneRef.current?.focus()}>
                    <span style={spacerStyle} />
                    <Phone size={16} color="var(--text-muted)" />
                    <span style={labelStyle}>Phone</span>
                    <input ref={phoneRef} value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} type="tel" placeholder="(555) 000-0000" style={inputStyle} />
                  </div>
                  <div className="field-row-hover" style={textRowStyle} onClick={() => homePhoneRef.current?.focus()}>
                    <span style={spacerStyle} />
                    <PhoneCall size={16} color="var(--text-muted)" />
                    <span style={labelStyle}>Home</span>
                    <input ref={homePhoneRef} value={homePhone} onChange={(e) => setHomePhone(formatPhone(e.target.value))} type="tel" placeholder="(555) 000-0000" style={inputStyle} />
                  </div>
                  <div className="field-row-hover" style={textRowStyle} onClick={() => emailRef.current?.focus()}>
                    <span style={spacerStyle} />
                    <Envelope size={16} color="var(--text-muted)" />
                    <span style={labelStyle}>Email</span>
                    <input ref={emailRef} value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" style={inputStyle} />
                  </div>
                  <div className="field-row-hover" style={{ ...textRowStyle, alignItems: 'flex-start' }} onClick={() => addressRef.current?.focus()}>
                    <span style={spacerStyle} />
                    <span style={{ paddingTop: 2 }}><House size={16} color="var(--text-muted)" /></span>
                    <span style={{ ...labelStyle, paddingTop: 2 }}>Address</span>
                    <textarea ref={addressRef} value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} placeholder="123 Main St, City, State ZIP" rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
                  </div>
                </DrawerSection>

                {/* ── NOTES ── */}
                <DrawerSection label="Notes">
                  <div className="field-row-hover" style={{ ...textRowStyle, alignItems: 'flex-start' }} onClick={() => spiritualRef.current?.focus()}>
                    <span style={spacerStyle} />
                    <span style={{ paddingTop: 2 }}><Church size={16} color="var(--text-muted)" /></span>
                    <span style={{ ...labelStyle, paddingTop: 2 }}>Spiritual</span>
                    <textarea ref={spiritualRef} value={spiritualNeeds} onChange={(e) => setSpiritualNeeds(e.target.value)} placeholder="Spiritual needs" rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
                  </div>
                  <div className="field-row-hover" style={{ ...textRowStyle, alignItems: 'flex-start' }} onClick={() => physicalRef.current?.focus()}>
                    <span style={spacerStyle} />
                    <span style={{ paddingTop: 2 }}><FirstAid size={16} color="var(--text-muted)" /></span>
                    <span style={{ ...labelStyle, paddingTop: 2 }}>Physical</span>
                    <textarea ref={physicalRef} value={physicalNeeds} onChange={(e) => setPhysicalNeeds(e.target.value)} placeholder="Physical needs" rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
                  </div>
                </DrawerSection>
              </>
            )}
          </div>
        </div>
      </div>

      {openPicker === 'status' && (
        <PickerMenu title="Membership status" options={MEMBERSHIP_OPTIONS} value={status} onSelect={(v) => setStatus(v as MembershipStatus)} onClose={() => setOpenPicker(null)} />
      )}
      {openPicker === 'language' && (
        <PickerMenu title="Language" options={LANGUAGE_OPTIONS} value={language} onSelect={(v) => setLanguage(v as Language)} onClose={() => setOpenPicker(null)} />
      )}
      {openPicker === 'gender' && (
        <PickerMenu title="Gender" options={GENDER_OPTIONS} value={gender} onSelect={(v) => setGender(v as Gender | '')} onClose={() => setOpenPicker(null)} />
      )}
      {openPicker === 'marital' && (
        <PickerMenu title="Marital Status" options={MARITAL_OPTIONS} value={maritalStatus} onSelect={(v) => setMaritalStatus(v as MaritalStatus | '')} onClose={() => setOpenPicker(null)} />
      )}
      {showPositionPicker && (
        <PositionPickerSheet selected={churchPositions} onToggle={togglePosition} onDone={() => setShowPositionPicker(false)} />
      )}
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const textRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  paddingTop: 12, paddingBottom: 12,
  borderBottom: '1px solid var(--border-light)', cursor: 'text',
};

const asteriskStyle: React.CSSProperties = {
  width: 10, fontSize: 14, color: 'var(--red)', flexShrink: 0, lineHeight: 1,
};

const spacerStyle: React.CSSProperties = {
  width: 10, flexShrink: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, color: 'var(--text-muted)', width: 60, flexShrink: 0,
};

const inputStyle: React.CSSProperties = {
  flex: 1, background: 'none', border: 'none', outline: 'none',
  fontSize: 14, color: 'var(--text-primary)',
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
};

// ── Sub-components ───────────────────────────────────────────────────────────

function DrawerSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={sectionLabelStyle}>{label}</p>
      <div className="no-last-border" style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)', overflow: 'hidden', padding: '0 16px' }}>
        {children}
      </div>
    </div>
  );
}

function PickerRow({ icon, label, value, onClick }: {
  icon: React.ReactNode; label: string; value: string; onClick: () => void;
}) {
  return (
    <button
      className="field-row-hover"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        paddingTop: 12, paddingBottom: 12,
        border: 'none', borderBottom: '1px solid var(--border-light)',
        background: 'none', cursor: 'pointer', textAlign: 'left' as const,
      }}
    >
      <span style={spacerStyle} />
      {icon}
      <span style={labelStyle}>{label}</span>
      <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', textAlign: 'left' }}>{value}</span>
      <CaretRight size={14} color="var(--text-muted)" />
    </button>
  );
}

function DateRow({ icon, label, value, inputRef, onChange }: {
  icon: React.ReactNode; label: string; value: string;
  inputRef: { current: HTMLInputElement | null };
  onChange: (v: string) => void;
}) {
  return (
    <button
      className="field-row-hover"
      onClick={() => inputRef.current?.showPicker()}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        paddingTop: 12, paddingBottom: 12,
        border: 'none', borderBottom: '1px solid var(--border-light)',
        background: 'none', cursor: 'pointer',
        textAlign: 'left' as const, position: 'relative',
      }}
    >
      <span style={spacerStyle} />
      {icon}
      <span style={labelStyle}>{label}</span>
      <span style={{ flex: 1, fontSize: 14, color: value ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'left' }}>
        {value ? fmtDate(value) : 'Not set'}
      </span>
      <CaretRight size={14} color="var(--text-muted)" />
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ position: 'absolute', left: 0, top: '50%', width: '100%', opacity: 0, pointerEvents: 'none', height: 1 }}
      />
    </button>
  );
}

function PositionPickerSheet({ selected, onToggle, onDone }: {
  selected: string[];
  onToggle: (pos: string) => void;
  onDone: () => void;
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(30,26,24,0.35)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onDone(); }}
    >
      <div
        style={{
          background: 'var(--surface)', borderRadius: '16px 16px 0 0',
          width: '100%', maxWidth: 430,
          paddingBottom: 'env(safe-area-inset-bottom, 24px)', overflow: 'hidden',
        }}
      >
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '12px auto 0' }} />
        <p style={{
          fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
          textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.06em',
          padding: '12px 20px 10px', borderBottom: '1px solid var(--border-light)',
        }}>Church Position</p>
        {CHURCH_POSITIONS.map((pos) => {
          const isSel = selected.includes(pos);
          return (
            <button
              key={pos}
              onClick={() => onToggle(pos)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '15px 20px',
                background: isSel ? 'var(--sage-light)' : 'none',
                border: 'none', borderBottom: '1px solid var(--border-light)',
                fontSize: 15, color: isSel ? 'var(--sage)' : 'var(--text-primary)',
                fontWeight: isSel ? 600 : 400, cursor: 'pointer', textAlign: 'left' as const,
              }}
            >
              <span>{pos}</span>
              {isSel && (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--sage)" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
          );
        })}
        <div style={{ padding: '16px 20px 0' }}>
          <button onClick={onDone} style={{ width: '100%', height: 44, borderRadius: 12, background: 'var(--sage)', color: '#fff', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Done</button>
        </div>
      </div>
    </div>
  );
}
