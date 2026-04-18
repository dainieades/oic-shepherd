'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { useToast } from './Toast';
import { formatPhone } from '@/lib/utils';
import { Person, MembershipStatus, ChurchAttendance, Language, Gender, MaritalStatus, CHURCH_POSITIONS, AppRole } from '@/lib/types';
import {
  User, TextT, Globe, Pulse, GenderIntersex, Cake, Heart, Sparkle, Church,
  IdentificationCard, CalendarCheck, Drop, Compass, Buildings, BookOpenText,
  Phone, PhoneCall, Envelope, House, FirstAid, CaretRight, HandHeart, UsersFour,
  PaperPlaneTilt,
} from '@phosphor-icons/react';
import PickerMenu from './PickerMenu';
import AppRolePickerSheet from './AppRolePickerSheet';
import InviteSheet from './InviteSheet';

interface Props {
  person: Person;
  onClose: () => void;
}

const MEMBERSHIP_OPTIONS: { value: MembershipStatus; label: string }[] = [
  { value: 'member',           label: 'Member' },
  { value: 'non-member',       label: 'Non-Member' },
  { value: 'membership-track', label: 'Membership Track' },
];

const CHURCH_ATTENDANCE_OPTIONS: { value: ChurchAttendance; label: string }[] = [
  { value: 'first-time-visitor', label: 'First-Time Visitor' },
  { value: 'regular',            label: 'Regular Attendee' },
  { value: 'on-leave',           label: 'On Leave' },
  { value: 'fellowship-group-only',   label: 'Fellowship Group Only' },
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

export default function EditPersonDrawer({ person, onClose }: Props) {
  const { data, currentPersona, updatePerson, assignShepherds, assignGroupsToPerson } = useApp();
  const { showToast } = useToast();

  // Basic — split existing englishName into first / last
  const _nameParts = person.englishName.trim().split(/\s+/);
  const [firstName, setFirstName] = useState(_nameParts[0] ?? '');
  const [lastName, setLastName]   = useState(_nameParts.slice(1).join(' '));
  const [chineseName, setChineseName] = useState(person.chineseName ?? '');

  // Personal
  const [language, setLanguage]           = useState<Language>(person.language);
  const [gender, setGender]               = useState<Gender | ''>(person.gender ?? '');
  const [birthday, setBirthday]           = useState(person.birthday ?? '');
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus | ''>(person.maritalStatus ?? '');
  const [anniversary, setAnniversary]     = useState(person.anniversary ?? '');

  // Church
  const [groupIds, setGroupIds]           = useState<string[]>(person.groupIds ?? []);
  const [shepherdIds, setShepherdIds]     = useState<string[]>(person.assignedShepherdIds ?? []);
  const [status, setStatus]               = useState<MembershipStatus>(person.membershipStatus);
  const [attendance, setAttendance]       = useState<ChurchAttendance>(person.churchAttendance);
  const [membershipDate, setMembershipDate] = useState(person.membershipDate ?? '');
  const [baptismDate, setBaptismDate]     = useState(person.baptismDate ?? '');
  const [isShepherd, setIsShepherd]           = useState(person.isShepherd ?? false);
  const [isBeingDiscipled, setIsBeingDiscipled] = useState(person.isBeingDiscipled ?? false);
  const [appRole, setAppRole] = useState<AppRole>(person.appRole ?? 'no-access');
  const [churchPositions, setChurchPositions] = useState<string[]>(person.churchPositions ?? []);

  // Contact
  const [phone, setPhone]           = useState(person.phone ? formatPhone(person.phone) : '');
  const [homePhone, setHomePhone]   = useState(person.homePhone ? formatPhone(person.homePhone) : '');
  const [email, setEmail]           = useState(person.email ?? '');
  const [homeAddress, setHomeAddress] = useState(person.homeAddress ?? '');

  // Text input refs (for click-to-focus)
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef  = useRef<HTMLInputElement>(null);
  const chineseRef   = useRef<HTMLInputElement>(null);
  const phoneRef     = useRef<HTMLInputElement>(null);
  const homePhoneRef = useRef<HTMLInputElement>(null);
  const emailRef     = useRef<HTMLInputElement>(null);
  const addressRef   = useRef<HTMLTextAreaElement>(null);
  // Hidden date input refs
  const birthdayRef      = useRef<HTMLInputElement>(null);
  const anniversaryRef   = useRef<HTMLInputElement>(null);
  const membershipDateRef = useRef<HTMLInputElement>(null);
  const baptismDateRef   = useRef<HTMLInputElement>(null);

  // Picker state
  const [openPicker, setOpenPicker] = useState<'status' | 'attendance' | 'language' | 'gender' | 'marital' | 'appRole' | null>(null);
  const statusBtnRef     = useRef<HTMLButtonElement>(null);
  const attendanceBtnRef = useRef<HTMLButtonElement>(null);
  const genderBtnRef     = useRef<HTMLButtonElement>(null);
  const maritalBtnRef    = useRef<HTMLButtonElement>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const groupBtnRef = useRef<HTMLButtonElement>(null);
  const [showShepherdPicker, setShowShepherdPicker] = useState(false);

  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

  const toggleGroup = (id: string) =>
    setGroupIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const selectedGroups = data.groups.filter((g) => groupIds.includes(g.id));

  const handleSave = async () => {
    if (!firstName.trim()) return;
    await assignGroupsToPerson(person.id, groupIds);
    await assignShepherds(person.id, shepherdIds);
    await updatePerson(person.id, {
      englishName: fullName,
      chineseName: chineseName.trim() || undefined,
      language,
      gender: gender || undefined,
      birthday: birthday || undefined,
      maritalStatus: maritalStatus || undefined,
      anniversary: (maritalStatus === 'married' && anniversary) ? anniversary : undefined,
      membershipStatus: status,
      churchAttendance: attendance,
      membershipDate: (status === 'member' && membershipDate) ? membershipDate : undefined,
      baptismDate: baptismDate || undefined,
      isShepherd: isShepherd || undefined,
      isBeingDiscipled: isBeingDiscipled || undefined,
      appRole,
      churchPositions: churchPositions.length > 0 ? churchPositions : undefined,
      phone: phone.trim() || undefined,
      homePhone: homePhone.trim() || undefined,
      email: email.trim() || undefined,
      homeAddress: homeAddress.trim() || undefined,
    });
    showToast('Changes saved');
    onClose();
  };

  const togglePosition = (pos: string) => {
    setChurchPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    );
  };

  // Build unified shepherd list: named personas + isShepherd people not covered by a persona
  const personaPersonIds = new Set(data.personas.map((p) => p.personId).filter(Boolean));
  type ShepherdEntry = { id: string; name: string; subtitle: string };
  const shepherdEntries: ShepherdEntry[] = [
    ...data.personas
      .filter((p) => p.role === 'shepherd' || p.role === 'admin')
      .map((p) => ({ id: p.id, name: p.name, subtitle: p.role === 'admin' ? 'Pastor' : 'Shepherd' })),
    ...data.people
      .filter((p) => p.isShepherd && !personaPersonIds.has(p.id))
      .map((p) => ({ id: p.id, name: p.englishName, subtitle: 'Shepherd' })),
  ];

  const statusLabel     = MEMBERSHIP_OPTIONS.find((o) => o.value === status)?.label ?? '';
  const attendanceLabel = CHURCH_ATTENDANCE_OPTIONS.find((o) => o.value === attendance)?.label ?? attendance;
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
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Edit person</span>
            <button onClick={handleSave} style={{ height: 32, padding: '0 14px', borderRadius: 8, background: 'var(--sage)', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Save</button>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 48px', background: 'var(--bg)' }}>

            {/* ── ACCESS ── */}
            {(currentPersona.role === 'admin' || (currentPersona.role === 'shepherd' && (appRole === 'shepherd' || appRole === 'no-access'))) && (
              <DrawerSection label="Access">
                {appRole === 'no-access' ? (
                  <button
                    className="field-row-hover"
                    onClick={() => setShowInvite(true)}
                    style={rowBtnStyle}
                  >
                    <span style={spacerStyle} />
                    <PaperPlaneTilt size={16} color="var(--text-muted)" />
                    <span style={labelStyle}>Invite</span>
                    <span style={{ flex: 1, fontSize: 14, color: 'var(--sage)', textAlign: 'right' }}>
                      Give app access…
                    </span>
                    <CaretRight size={14} color="var(--text-muted)" />
                  </button>
                ) : (
                  <button
                    className="field-row-hover"
                    onClick={() => setOpenPicker('appRole')}
                    style={rowBtnStyle}
                  >
                    <span style={spacerStyle} />
                    <IdentificationCard size={16} color="var(--text-muted)" />
                    <span style={labelStyle}>App Role</span>
                    <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', textAlign: 'right' }}>
                      {{ admin: 'Admin', shepherd: 'Shepherd', 'welcome-team': 'Welcome Team', 'no-access': 'No Access' }[appRole]}
                    </span>
                    <CaretRight size={14} color="var(--text-muted)" />
                  </button>
                )}
              </DrawerSection>
            )}

            {/* ── BASIC ── */}
            <DrawerSection label="Basic">
              <div className="field-row-hover" style={textRowStyle} onClick={() => firstNameRef.current?.focus()}>
                <span style={asteriskStyle}>*</span>
                <User size={16} color="var(--text-muted)" />
                <span style={labelStyle}>Preferred</span>
                <input ref={firstNameRef} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Preferred name" style={inputInlineStyle} />
              </div>
              <div className="field-row-hover" style={textRowStyle} onClick={() => lastNameRef.current?.focus()}>
                <span style={spacerStyle} />
                <User size={16} color="var(--text-muted)" style={{ opacity: 0 }} />
                <span style={labelStyle}>Last</span>
                <input ref={lastNameRef} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" style={inputInlineStyle} />
              </div>
              <div className="field-row-hover" style={textRowStyle} onClick={() => chineseRef.current?.focus()}>
                <span style={spacerStyle} />
                <TextT size={16} color="var(--text-muted)" />
                <span style={labelStyle}>Alt. name</span>
                <input ref={chineseRef} value={chineseName} onChange={(e) => setChineseName(e.target.value)} placeholder="Legal name, 中文名…" style={inputInlineStyle} />
              </div>
            </DrawerSection>

            {/* ── PERSONAL ── */}
            <DrawerSection label="Personal">
              <PickerRow ref={genderBtnRef} icon={<GenderIntersex size={16} color="var(--text-muted)" />} label="Gender" value={genderLabel} onClick={() => setOpenPicker('gender')} />
              <DateRow icon={<Cake size={16} color="var(--text-muted)" />} label="Birthday" value={birthday} inputRef={birthdayRef} onChange={setBirthday} />
              <PickerRow ref={maritalBtnRef} icon={<Heart size={16} color="var(--text-muted)" />} label="Marital" value={maritalLabel} onClick={() => setOpenPicker('marital')} />
              {maritalStatus === 'married' && (
                <DateRow icon={<Sparkle size={16} color="var(--text-muted)" />} label="Anniversary" value={anniversary} inputRef={anniversaryRef} onChange={setAnniversary} />
              )}
            </DrawerSection>

            {/* ── CHURCH ── */}
            <DrawerSection label="Church">
              <PickerRow ref={statusBtnRef} icon={<IdentificationCard size={16} color="var(--text-muted)" />} label="Status" value={statusLabel} onClick={() => setOpenPicker('status')} />
              <PickerRow ref={attendanceBtnRef} icon={<Pulse size={16} color="var(--text-muted)" />} label="Attendance" value={attendanceLabel} onClick={() => setOpenPicker('attendance')} />
              {status === 'member' && (
                <DateRow icon={<CalendarCheck size={16} color="var(--text-muted)" />} label="Member Since" value={membershipDate} inputRef={membershipDateRef} onChange={setMembershipDate} />
              )}
              <button ref={groupBtnRef} className="field-row-hover" onClick={() => setShowGroupPicker(v => !v)} style={rowBtnStyle}>
                <span style={spacerStyle} />
                <UsersFour size={16} color="var(--text-muted)" />
                <span style={labelStyle}>Groups</span>
                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {selectedGroups.length > 0
                    ? selectedGroups.map((g) => (
                        <span key={g.id} style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: 'var(--blue-light)', color: 'var(--blue)', flexShrink: 0 }}>{g.name}</span>
                      ))
                    : <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>None</span>
                  }
                </div>
                <CaretRight size={14} color="var(--text-muted)" />
              </button>
              <button className="field-row-hover" onClick={() => setShowShepherdPicker(true)} style={rowBtnStyle}>
                <span style={spacerStyle} />
                <HandHeart size={16} color="var(--text-muted)" />
                <span style={labelStyle}>Shepherd by</span>
                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {shepherdIds.length > 0
                    ? shepherdEntries.filter((e) => shepherdIds.includes(e.id)).map((e) => (
                        <span key={e.id} style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: 'var(--sage-light)', color: 'var(--sage)', flexShrink: 0 }}>{e.name}</span>
                      ))
                    : <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>None</span>
                  }
                </div>
                <CaretRight size={14} color="var(--text-muted)" />
              </button>
              <button className="field-row-hover" onClick={() => setIsShepherd((v) => !v)} style={rowBtnStyle}>
                <span style={spacerStyle} />
                <Compass size={16} color="var(--text-muted)" />
                <span style={{ ...labelStyle, flex: 1 }}>Is Shepherd?</span>
                <div style={{ width: 42, height: 24, borderRadius: 12, flexShrink: 0, background: isShepherd ? 'var(--sage)' : 'var(--border)', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: 3, left: isShepherd ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
              </button>
              <button className="field-row-hover" onClick={() => setIsBeingDiscipled((v) => !v)} style={rowBtnStyle}>
                <span style={spacerStyle} />
                <BookOpenText size={16} color="var(--text-muted)" />
                <span style={{ ...labelStyle, flex: 1 }}>Being discipled?</span>
                <div style={{ width: 42, height: 24, borderRadius: 12, flexShrink: 0, background: isBeingDiscipled ? 'var(--sage)' : 'var(--border)', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: 3, left: isBeingDiscipled ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
              </button>
              <button className="field-row-hover" onClick={() => setShowPositionPicker(true)} style={rowBtnStyle}>
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
              <DateRow icon={<Drop size={16} color="var(--text-muted)" />} label="Baptism Date" value={baptismDate} inputRef={baptismDateRef} onChange={setBaptismDate} />
            </DrawerSection>

            {/* ── CONTACT ── */}
            <DrawerSection label="Contact">
              <div className="field-row-hover" style={textRowStyle} onClick={() => phoneRef.current?.focus()}>
                <span style={spacerStyle} />
                <Phone size={16} color="var(--text-muted)" />
                <span style={labelStyle}>Phone</span>
                <input ref={phoneRef} value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} type="tel" placeholder="(555) 000-0000" style={inputInlineStyle} />
              </div>
              <div className="field-row-hover" style={textRowStyle} onClick={() => homePhoneRef.current?.focus()}>
                <span style={spacerStyle} />
                <PhoneCall size={16} color="var(--text-muted)" />
                <span style={labelStyle}>Home</span>
                <input ref={homePhoneRef} value={homePhone} onChange={(e) => setHomePhone(formatPhone(e.target.value))} type="tel" placeholder="(555) 000-0000" style={inputInlineStyle} />
              </div>
              <div className="field-row-hover" style={textRowStyle} onClick={() => emailRef.current?.focus()}>
                <span style={spacerStyle} />
                <Envelope size={16} color="var(--text-muted)" />
                <span style={labelStyle}>Email</span>
                <input ref={emailRef} value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" style={inputInlineStyle} />
              </div>
              <div className="field-row-hover" style={{ ...textRowStyle, alignItems: 'flex-start' }} onClick={() => addressRef.current?.focus()}>
                <span style={spacerStyle} />
                <span style={{ paddingTop: 2 }}><House size={16} color="var(--text-muted)" /></span>
                <span style={{ ...labelStyle, paddingTop: 2 }}>Address</span>
                <textarea ref={addressRef} value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} placeholder="123 Main St, City, State ZIP" rows={2} style={{ ...inputInlineStyle, resize: 'vertical', lineHeight: 1.5 }} />
              </div>
            </DrawerSection>

          </div>
        </div>
      </div>

      {openPicker === 'status' && (
        <PickerMenu anchorRef={statusBtnRef} title="Membership status" options={MEMBERSHIP_OPTIONS} value={status} onSelect={(v) => setStatus(v as MembershipStatus)} onClose={() => setOpenPicker(null)} />
      )}
      {openPicker === 'attendance' && (
        <PickerMenu anchorRef={attendanceBtnRef} title="Church Attendance" options={CHURCH_ATTENDANCE_OPTIONS} value={attendance} onSelect={(v) => setAttendance(v as ChurchAttendance)} onClose={() => setOpenPicker(null)} />
      )}

      {openPicker === 'gender' && (
        <PickerMenu anchorRef={genderBtnRef} title="Gender" options={GENDER_OPTIONS} value={gender} onSelect={(v) => setGender(v as Gender | '')} onClose={() => setOpenPicker(null)} />
      )}
      {openPicker === 'marital' && (
        <PickerMenu anchorRef={maritalBtnRef} title="Marital Status" options={MARITAL_OPTIONS} value={maritalStatus} onSelect={(v) => setMaritalStatus(v as MaritalStatus | '')} onClose={() => setOpenPicker(null)} />
      )}
      {openPicker === 'appRole' && (
        <AppRolePickerSheet
          currentRole={appRole}
          onSelect={(role) => setAppRole(role)}
          onRemove={() => setAppRole('no-access')}
          onClose={() => setOpenPicker(null)}
          isAdmin={currentPersona.role === 'admin'}
          personName={person.englishName.split(' ')[0]}
        />
      )}
      {showInvite && (
        <InviteSheet
          onClose={() => setShowInvite(false)}
          initialEmail={person.email ?? ''}
          initialRole="shepherd"
          personName={person.englishName}
          personId={person.id}
        />
      )}
      {showPositionPicker && (
        <PositionPickerSheet
          currentPositions={churchPositions}
          onConfirm={(positions) => { setChurchPositions(positions); setShowPositionPicker(false); }}
          onBack={() => setShowPositionPicker(false)}
        />
      )}
      {showGroupPicker && (
        <GroupPickerSheet
          groups={data.groups}
          currentIds={groupIds}
          onConfirm={(ids) => { setGroupIds(ids); setShowGroupPicker(false); }}
          onBack={() => setShowGroupPicker(false)}
        />
      )}
      {showShepherdPicker && (
        <ShepherdPickerSheet
          entries={shepherdEntries}
          currentIds={shepherdIds}
          onConfirm={(ids) => { setShepherdIds(ids); setShowShepherdPicker(false); }}
          onBack={() => setShowShepherdPicker(false)}
        />
      )}
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const rowBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  paddingTop: 12, paddingBottom: 12,
  paddingRight: 16,
  border: 'none', borderBottom: '1px solid var(--border-light)',
  background: 'none', cursor: 'pointer', textAlign: 'left' as const,
};

const textRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  paddingTop: 12, paddingBottom: 12,
  paddingRight: 16,
  borderBottom: '1px solid var(--border-light)', cursor: 'text',
};

const asteriskStyle: React.CSSProperties = {
  width: 8, fontSize: 14, color: 'var(--red)', flexShrink: 0, lineHeight: 1,
};

const spacerStyle: React.CSSProperties = {
  width: 8, flexShrink: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, color: 'var(--text-muted)', width: 76, flexShrink: 0,
};

const inputInlineStyle: React.CSSProperties = {
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
      <div className="no-last-border" style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)', overflow: 'hidden', padding: '0 20px' }}>
        {children}
      </div>
    </div>
  );
}

const PickerRow = React.forwardRef<HTMLButtonElement, {
  icon: React.ReactNode; label: string; value: string; onClick: () => void;
}>(({ icon, label, value, onClick }, ref) => {
  return (
    <button ref={ref} className="field-row-hover" onClick={onClick} style={rowBtnStyle}>
      <span style={spacerStyle} />
      {icon}
      <span style={labelStyle}>{label}</span>
      <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', textAlign: 'left' }}>{value}</span>
      <CaretRight size={14} color="var(--text-muted)" />
    </button>
  );
});

function DateRow({ icon, label, value, inputRef, onChange }: {
  icon: React.ReactNode; label: string; value: string;
  inputRef: { current: HTMLInputElement | null };
  onChange: (v: string) => void;
}) {
  return (
    <button
      className="field-row-hover"
      onClick={() => inputRef.current?.showPicker()}
      style={{ ...rowBtnStyle, position: 'relative' }}
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

const shepherdAvatarPalette = [
  { bg: '#EAF2EE', color: '#5B8A72' },
  { bg: '#EBF1F7', color: '#6B8EAE' },
  { bg: '#F5F0EB', color: '#8C7055' },
  { bg: '#F0EBF5', color: '#7A6A8C' },
];

function GroupPickerSheet({ groups, currentIds, onConfirm, onBack }: {
  groups: import('@/lib/types').Group[];
  currentIds: string[];
  onConfirm: (ids: string[]) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(currentIds);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const q = search.toLowerCase();
  const filtered = groups.filter(g => !q || g.name.toLowerCase().includes(q));
  const toggle = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
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
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Fellowship Groups</span>
          <button onClick={() => onConfirm(selectedIds)} style={{ fontSize: 14, fontWeight: 600, color: 'var(--sage)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {selectedIds.length > 0 ? `Done (${selectedIds.length})` : 'Done'}
          </button>
        </div>
        <div style={{ padding: '12px 20px', flexShrink: 0, borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search groups…"
              style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', background: 'none', border: 'none', outline: 'none' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((g) => {
            const isSel = selectedIds.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => toggle(g.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px',
                  background: isSel ? 'var(--blue-light)' : 'none',
                  border: 'none', borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer', textAlign: 'left' as const,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: isSel ? 600 : 400, color: isSel ? 'var(--blue)' : 'var(--text-primary)', margin: 0 }}>{g.name}</p>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                  border: isSel ? 'none' : '1.5px solid var(--border)',
                  background: isSel ? 'var(--blue)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}>
                  {isSel && (
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p style={{ padding: '24px 20px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>No groups found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ShepherdPickerSheet({ entries, currentIds, onConfirm, onBack }: {
  entries: { id: string; name: string; subtitle: string }[];
  currentIds: string[];
  onConfirm: (ids: string[]) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(currentIds);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const q = search.toLowerCase();
  const filtered = entries.filter((e) => !q || e.name.toLowerCase().includes(q));

  const toggle = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
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
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Shepherd</span>
          <button onClick={() => onConfirm(selectedIds)} style={{ fontSize: 14, fontWeight: 600, color: 'var(--sage)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {selectedIds.length > 0 ? `Done (${selectedIds.length})` : 'Done'}
          </button>
        </div>
        <div style={{ padding: '12px 20px', flexShrink: 0, borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shepherds…"
              style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', background: 'none', border: 'none', outline: 'none' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((entry, i) => {
            const isSel = selectedIds.includes(entry.id);
            const palette = shepherdAvatarPalette[i % shepherdAvatarPalette.length];
            const initials = entry.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
            return (
              <button
                key={entry.id}
                onClick={() => toggle(entry.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px',
                  background: isSel ? 'var(--sage-light)' : 'none',
                  border: 'none', borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer', textAlign: 'left' as const,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: isSel ? 'var(--sage)' : palette.bg,
                  color: isSel ? '#fff' : palette.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: isSel ? 600 : 400, color: isSel ? 'var(--sage)' : 'var(--text-primary)', margin: 0 }}>{entry.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{entry.subtitle}</p>
                </div>
                <ShepherdCheckCircle selected={isSel} />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p style={{ padding: '24px 20px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>No shepherds found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ShepherdCheckCircle({ selected }: { selected: boolean }) {
  return (
    <div style={{
      width: 20, height: 20, borderRadius: 5, flexShrink: 0,
      border: selected ? 'none' : '1.5px solid var(--border)',
      background: selected ? 'var(--sage)' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.15s',
    }}>
      {selected && (
        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      )}
    </div>
  );
}

function PositionPickerSheet({ currentPositions, onConfirm, onBack }: {
  currentPositions: string[];
  onConfirm: (positions: string[]) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<string[]>(currentPositions);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const q = search.toLowerCase();
  const filtered = CHURCH_POSITIONS.filter(pos => !q || pos.toLowerCase().includes(q));
  const toggle = (pos: string) =>
    setSelectedPositions(prev => prev.includes(pos) ? prev.filter(x => x !== pos) : [...prev, pos]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
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
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Church Position</span>
          <button onClick={() => onConfirm(selectedPositions)} style={{ fontSize: 14, fontWeight: 600, color: 'var(--sage)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {selectedPositions.length > 0 ? `Done (${selectedPositions.length})` : 'Done'}
          </button>
        </div>
        <div style={{ padding: '12px 20px', flexShrink: 0, borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search positions…"
              style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', background: 'none', border: 'none', outline: 'none' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((pos) => {
            const isSel = selectedPositions.includes(pos);
            return (
              <button
                key={pos}
                onClick={() => toggle(pos)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px',
                  background: isSel ? 'var(--sage-light)' : 'none',
                  border: 'none', borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer', textAlign: 'left' as const,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: isSel ? 600 : 400, color: isSel ? 'var(--sage)' : 'var(--text-primary)', margin: 0 }}>{pos}</p>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                  border: isSel ? 'none' : '1.5px solid var(--border)',
                  background: isSel ? 'var(--sage)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}>
                  {isSel && (
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p style={{ padding: '24px 20px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>No positions found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
