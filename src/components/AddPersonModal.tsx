'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DrawerSection } from '@/components/form/DrawerSection';
import {
  User,
  TextT,
  Pulse,
  GenderIntersex,
  Cake,
  Heart,
  Sparkle,
  Church,
  IdentificationCard,
  CalendarCheck,
  Drop,
  Compass,
  Buildings,
  BookOpenText,
  Phone,
  PhoneCall,
  Envelope,
  House,
  FirstAid,
  CaretRight,
  HandHeart,
  UsersFour,
  MagnifyingGlass,
  Check,
} from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { useToast } from './Toast';
import { formatPhone, fmtDate } from '@/lib/utils';
import { BottomSheet, ModalHeader } from './BottomSheet';
import { PickerRow, DateRow } from '@/components/form';
import {
  type MembershipStatus,
  type ChurchAttendance,
  type Gender,
  type MaritalStatus,
  CHURCH_POSITIONS,
} from '@/lib/types';
import PickerMenu from './PickerMenu';
import { BACKDROP_COLOR, SHEET_MAX_WIDTH, SHEET_BORDER_RADIUS, SHEPHERD_AVATAR_PALETTE, Z_SHEET } from '@/lib/constants';
import { AvatarBadge } from './AvatarBadge';

interface AddPersonModalProps {
  onClose: () => void;
}

const MEMBERSHIP_OPTIONS: { value: MembershipStatus; label: string }[] = [
  { value: 'member', label: 'Member' },
  { value: 'non-member', label: 'Non-Member' },
  { value: 'membership-track', label: 'Membership Track' },
];

const CHURCH_ATTENDANCE_OPTIONS: { value: ChurchAttendance; label: string }[] = [
  { value: 'first-time-visitor', label: 'First-Time Visitor' },
  { value: 'regular', label: 'Regular Attendee' },
  { value: 'on-leave', label: 'On Leave' },
  { value: 'fellowship-group-only', label: 'Fellowship Group Only' },
];

const GENDER_OPTIONS: { value: Gender | ''; label: string }[] = [
  { value: '', label: 'Not set' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const MARITAL_OPTIONS: { value: MaritalStatus | ''; label: string }[] = [
  { value: '', label: 'Not set' },
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'divorced', label: 'Divorced' },
];

export default function AddPersonModal({ onClose }: AddPersonModalProps) {
  const { data, addPerson, assignGroupsToPerson, assignShepherds, setFullPageModalOpen } = useApp();
  React.useEffect(() => {
    setFullPageModalOpen(true);
    return () => setFullPageModalOpen(false);
  }, [setFullPageModalOpen]);
  const { showToast } = useToast();

  // Basic
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [chineseName, setChineseName] = useState('');

  // Personal
  const [gender, setGender] = useState<Gender | ''>('');
  const [birthday, setBirthday] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus | ''>('');
  const [anniversary, setAnniversary] = useState('');

  // Church
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [shepherdIds, setShepherdIds] = useState<string[]>([]);
  const [status, setStatus] = useState<MembershipStatus>('non-member');
  const [attendance, setAttendance] = useState<ChurchAttendance>('first-time-visitor');
  const [membershipDate, setMembershipDate] = useState('');
  const [baptismDate, setBaptismDate] = useState('');
  const [isShepherd, setIsShepherd] = useState(false);
  const [isBeingDiscipled, setIsBeingDiscipled] = useState(false);
  const [sheepIds, setSheepIds] = useState<string[]>([]);
  const [showSheepPicker, setShowSheepPicker] = useState(false);
  const [churchPositions, setChurchPositions] = useState<string[]>([]);

  // Contact
  const [phone, setPhone] = useState('');
  const [homePhone, setHomePhone] = useState('');
  const [email, setEmail] = useState('');
  const [homeAddress, setHomeAddress] = useState('');

  // Notes
  const [spiritualNeeds, setSpiritualNeeds] = useState('');
  const [physicalNeeds, setPhysicalNeeds] = useState('');

  // Text input refs
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const chineseRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const homePhoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const spiritualRef = useRef<HTMLTextAreaElement>(null);
  const physicalRef = useRef<HTMLTextAreaElement>(null);

  // Date input refs
  const birthdayRef = useRef<HTMLInputElement>(null);
  const anniversaryRef = useRef<HTMLInputElement>(null);
  const membershipDateRef = useRef<HTMLInputElement>(null);
  const baptismDateRef = useRef<HTMLInputElement>(null);

  const statusBtnRef = useRef<HTMLButtonElement>(null);
  const attendanceBtnRef = useRef<HTMLButtonElement>(null);
  const genderBtnRef = useRef<HTMLButtonElement>(null);
  const maritalBtnRef = useRef<HTMLButtonElement>(null);

  // Picker state
  const [openPicker, setOpenPicker] = useState<
    'status' | 'attendance' | 'gender' | 'marital' | null
  >(null);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [showShepherdPicker, setShowShepherdPicker] = useState(false);
  const [showSheepPickerSheet, setShowSheepPickerSheet] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

  // Build shepherd entries (same as EditPersonDrawer)
  const personaPersonIds = new Set(data.personas.map((p) => p.personId).filter(Boolean));
  type ShepherdEntry = { id: string; name: string; subtitle: string; photo?: string };
  const shepherdEntries: ShepherdEntry[] = [
    ...data.personas
      .filter((p) => p.role === 'shepherd' || p.role === 'admin')
      .map((p) => ({
        id: p.id,
        name: p.name,
        subtitle: p.role === 'admin' ? 'Pastor' : 'Shepherd',
        photo: p.personId ? data.people.find((person) => person.id === p.personId)?.photo : undefined,
      })),
    ...data.people
      .filter((p) => p.isShepherd && !personaPersonIds.has(p.id))
      .map((p) => ({ id: p.id, name: p.englishName, subtitle: 'Shepherd', photo: p.photo })),
  ];

  const selectedGroups = data.groups.filter((g) => groupIds.includes(g.id));

  const handleSave = async () => {
    if (!firstName.trim()) return;
    const newId = await addPerson({
      englishName: fullName,
      chineseName: chineseName.trim() || undefined,
      language: ['English'],
      gender: gender || undefined,
      birthday: birthday || undefined,
      maritalStatus: maritalStatus || undefined,
      anniversary: maritalStatus === 'married' && anniversary ? anniversary : undefined,
      membershipStatus: status,
      churchAttendance: attendance,
      membershipDate: status === 'member' && membershipDate ? membershipDate : undefined,
      baptismDate: baptismDate || undefined,
      isShepherd: isShepherd || undefined,
      isBeingDiscipled: isBeingDiscipled || undefined,
      churchPositions: churchPositions.length > 0 ? churchPositions : undefined,
      phone: phone.trim() || undefined,
      homePhone: homePhone.trim() || undefined,
      email: email.trim() || undefined,
      homeAddress: homeAddress.trim() || undefined,
      spiritualNeeds: spiritualNeeds.trim() || undefined,
      physicalNeeds: physicalNeeds.trim() || undefined,
    });
    await Promise.all([
      ...(groupIds.length > 0 ? [assignGroupsToPerson(newId, groupIds)] : []),
      ...(shepherdIds.length > 0 ? [assignShepherds(newId, shepherdIds)] : []),
    ]);
    if (isShepherd && sheepIds.length > 0) {
      for (const sheepId of sheepIds) {
        const sheep = data.people.find((p) => p.id === sheepId);
        if (sheep) await assignShepherds(sheepId, [...sheep.assignedShepherdIds, newId]);
      }
    }
    showToast('Person added');
    setSubmitted(true);
    setTimeout(() => onClose(), 1600);
  };

  const statusLabel = MEMBERSHIP_OPTIONS.find((o) => o.value === status)?.label ?? '';
  const attendanceLabel =
    CHURCH_ATTENDANCE_OPTIONS.find((o) => o.value === attendance)?.label ?? attendance;
  const genderLabel = GENDER_OPTIONS.find((o) => o.value === gender)?.label ?? 'Not set';
  const maritalLabel = MARITAL_OPTIONS.find((o) => o.value === maritalStatus)?.label ?? 'Not set';

  return (
    <>
      <BottomSheet onClose={onClose} aria-labelledby="add-person-title">
          <ModalHeader
            title="Add person"
            titleId="add-person-title"
            onCancel={onClose}
            onAction={handleSave}
            actionLabel="Save"
            actionDisabled={!firstName.trim()}
          />

          {/* Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.25rem 1.25rem 3rem',
              background: 'var(--bg)',
            }}
          >
            {submitted ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  paddingTop: 60,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'var(--sage-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={24} color="var(--sage)" weight="bold" />
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Person added
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {fullName} has been added to the directory.
                </p>
              </div>
            ) : (
              <>
                {/* ── BASIC ── */}
                <DrawerSection label="Basic">
                  <div
                    className="field-row-hover"
                    style={textRowStyle}
                    onClick={() => firstNameRef.current?.focus()}
                  >
                    <span style={asteriskStyle}>*</span>
                    <User size={16} color="var(--text-muted)" />
                    <span style={labelStyle}>Preferred</span>
                    <input
                      ref={firstNameRef}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Preferred name"
                      autoFocus
                      style={inputStyle}
                    />
                  </div>
                  <div
                    className="field-row-hover"
                    style={textRowStyle}
                    onClick={() => lastNameRef.current?.focus()}
                  >
                    <span style={spacerStyle} />
                    <User size={16} color="var(--text-muted)" style={{ opacity: 0 }} />
                    <span style={labelStyle}>Last</span>
                    <input
                      ref={lastNameRef}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      style={inputStyle}
                    />
                  </div>
                  <div
                    className="field-row-hover"
                    style={textRowStyle}
                    onClick={() => chineseRef.current?.focus()}
                  >
                    <span style={spacerStyle} />
                    <TextT size={16} color="var(--text-muted)" />
                    <span style={labelStyle}>Alt. name</span>
                    <input
                      ref={chineseRef}
                      value={chineseName}
                      onChange={(e) => setChineseName(e.target.value)}
                      placeholder="Legal name, 中文名…"
                      style={inputStyle}
                    />
                  </div>
                </DrawerSection>

                {/* ── PERSONAL ── */}
                <DrawerSection label="Personal">
                  <PickerRow
                    ref={genderBtnRef}
                    icon={<GenderIntersex size={16} color="var(--text-muted)" />}
                    label="Gender"
                    value={genderLabel}
                    onClick={() => setOpenPicker('gender')}
                  />
                  <DateRow
                    icon={<Cake size={16} color="var(--text-muted)" />}
                    label="Birthday"
                    value={birthday}
                    inputRef={birthdayRef}
                    onChange={setBirthday}
                  />
                  <PickerRow
                    ref={maritalBtnRef}
                    icon={<Heart size={16} color="var(--text-muted)" />}
                    label="Marital"
                    value={maritalLabel}
                    onClick={() => setOpenPicker('marital')}
                  />
                  {maritalStatus === 'married' && (
                    <DateRow
                      icon={<Sparkle size={16} color="var(--text-muted)" />}
                      label="Anniversary"
                      value={anniversary}
                      inputRef={anniversaryRef}
                      onChange={setAnniversary}
                    />
                  )}
                </DrawerSection>

                {/* ── CHURCH ── */}
                <DrawerSection label="Church">
                  <PickerRow
                    ref={statusBtnRef}
                    icon={<IdentificationCard size={16} color="var(--text-muted)" />}
                    label="Status"
                    value={statusLabel}
                    onClick={() => setOpenPicker('status')}
                  />
                  <PickerRow
                    ref={attendanceBtnRef}
                    icon={<Pulse size={16} color="var(--text-muted)" />}
                    label="Attendance"
                    value={attendanceLabel}
                    onClick={() => setOpenPicker('attendance')}
                  />
                  {status === 'member' && (
                    <DateRow
                      icon={<CalendarCheck size={16} color="var(--text-muted)" />}
                      label="Member Since"
                      value={membershipDate}
                      inputRef={membershipDateRef}
                      onChange={setMembershipDate}
                    />
                  )}
                  <button
                    className="field-row-hover"
                    onClick={() => setShowGroupPicker(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      paddingTop: 12,
                      paddingBottom: 12,
                      border: 'none',
                      borderBottom: '1px solid var(--border-light)',
                      background: 'none',
                      cursor: 'pointer',
                      textAlign: 'left' as const,
                    }}
                  >
                    <span style={spacerStyle} />
                    <UsersFour size={16} color="var(--text-muted)" />
                    <span style={labelStyle}>Groups</span>
                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {selectedGroups.length > 0 ? (
                        selectedGroups.map((g) => (
                          <span
                            key={g.id}
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              padding: '0.125rem 0.5rem',
                              borderRadius: 'var(--radius-pill)',
                              background: 'var(--blue-light)',
                              color: 'var(--blue)',
                              flexShrink: 0,
                            }}
                          >
                            {g.name}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>None</span>
                      )}
                    </div>
                    <CaretRight size={14} color="var(--text-muted)" />
                  </button>
                  <button
                    className="field-row-hover"
                    onClick={() => setShowShepherdPicker(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      paddingTop: 12,
                      paddingBottom: 12,
                      border: 'none',
                      borderBottom: '1px solid var(--border-light)',
                      background: 'none',
                      cursor: 'pointer',
                      textAlign: 'left' as const,
                    }}
                  >
                    <span style={spacerStyle} />
                    <HandHeart size={16} color="var(--text-muted)" />
                    <span style={labelStyle}>Shepherd by</span>
                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {shepherdIds.length > 0 ? (
                        data.personas
                          .filter((p) => shepherdIds.includes(p.id))
                          .map((p) => (
                            <span
                              key={p.id}
                              style={{
                                fontSize: 11,
                                fontWeight: 500,
                                padding: '0.125rem 0.5rem',
                                borderRadius: 'var(--radius-pill)',
                                background: 'var(--sage-light)',
                                color: 'var(--sage)',
                                flexShrink: 0,
                              }}
                            >
                              {p.name}
                            </span>
                          ))
                      ) : (
                        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>None</span>
                      )}
                    </div>
                    <CaretRight size={14} color="var(--text-muted)" />
                  </button>
                  <button
                    className="field-row-hover"
                    onClick={() => setIsShepherd((v) => !v)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      paddingTop: 12,
                      paddingBottom: 12,
                      border: 'none',
                      borderBottom: '1px solid var(--border-light)',
                      background: 'none',
                      cursor: 'pointer',
                      textAlign: 'left' as const,
                    }}
                  >
                    <span style={spacerStyle} />
                    <Compass size={16} color="var(--text-muted)" />
                    <span style={{ ...labelStyle, flex: 1 }}>Is Shepherd?</span>
                    <div
                      style={{
                        width: 42,
                        height: 24,
                        borderRadius: 'var(--radius-md)',
                        flexShrink: 0,
                        background: isShepherd ? 'var(--sage)' : 'var(--border)',
                        position: 'relative',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 3,
                          left: isShepherd ? 21 : 3,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: 'var(--surface)',
                          transition: 'left 0.2s',
                        }}
                      />
                    </div>
                  </button>
                  {isShepherd && (
                    <button
                      className="field-row-hover"
                      onClick={() => setShowSheepPickerSheet(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        paddingTop: 12,
                        paddingBottom: 12,
                        border: 'none',
                        borderBottom: '1px solid var(--border-light)',
                        background: 'none',
                        cursor: 'pointer',
                        textAlign: 'left' as const,
                      }}
                    >
                      <span style={spacerStyle} />
                      <HandHeart size={16} color="var(--text-muted)" />
                      <span style={labelStyle}>Sheep</span>
                      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {sheepIds.length > 0 ? (
                          <>
                            {data.people
                              .filter((p) => sheepIds.includes(p.id))
                              .slice(0, 5)
                              .map((p) => (
                                <span
                                  key={p.id}
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 500,
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: 'var(--radius-pill)',
                                    background: 'var(--sage-light)',
                                    color: 'var(--sage)',
                                    flexShrink: 0,
                                  }}
                                >
                                  {p.englishName}
                                </span>
                              ))}
                            {sheepIds.length > 5 && (
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>
                                +{sheepIds.length - 5} more
                              </span>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>None</span>
                        )}
                      </div>
                      <CaretRight size={14} color="var(--text-muted)" />
                    </button>
                  )}
                  <button
                    className="field-row-hover"
                    onClick={() => setIsBeingDiscipled((v) => !v)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      paddingTop: 12,
                      paddingBottom: 12,
                      border: 'none',
                      borderBottom: '1px solid var(--border-light)',
                      background: 'none',
                      cursor: 'pointer',
                      textAlign: 'left' as const,
                    }}
                  >
                    <span style={spacerStyle} />
                    <BookOpenText size={16} color="var(--text-muted)" />
                    <span style={{ ...labelStyle, flex: 1 }}>Being discipled?</span>
                    <div
                      style={{
                        width: 42,
                        height: 24,
                        borderRadius: 'var(--radius-md)',
                        flexShrink: 0,
                        background: isBeingDiscipled ? 'var(--sage)' : 'var(--border)',
                        position: 'relative',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 3,
                          left: isBeingDiscipled ? 21 : 3,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: 'var(--surface)',
                          transition: 'left 0.2s',
                        }}
                      />
                    </div>
                  </button>
                  <button
                    className="field-row-hover"
                    onClick={() => setShowPositionPicker(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      paddingTop: 12,
                      paddingBottom: 12,
                      border: 'none',
                      borderBottom: '1px solid var(--border-light)',
                      background: 'none',
                      cursor: 'pointer',
                      textAlign: 'left' as const,
                    }}
                  >
                    <span style={spacerStyle} />
                    <Buildings size={16} color="var(--text-muted)" />
                    <span style={labelStyle}>Position</span>
                    <span style={{ flex: 1, fontSize: 14, color: churchPositions.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'right' }}>
                      {churchPositions.length > 0 ? churchPositions.join(', ') : 'None'}
                    </span>
                    <CaretRight size={14} color="var(--text-muted)" />
                  </button>
                  <DateRow
                    icon={<Drop size={16} color="var(--text-muted)" />}
                    label="Baptism Date"
                    value={baptismDate}
                    inputRef={baptismDateRef}
                    onChange={setBaptismDate}
                  />
                </DrawerSection>

                {/* ── CONTACT ── */}
                <DrawerSection label="Contact">
                  <div
                    className="field-row-hover"
                    style={textRowStyle}
                    onClick={() => phoneRef.current?.focus()}
                  >
                    <span style={spacerStyle} />
                    <Phone size={16} color="var(--text-muted)" />
                    <span style={labelStyle}>Phone</span>
                    <input
                      ref={phoneRef}
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      type="tel"
                      placeholder="(555) 000-0000"
                      style={inputStyle}
                    />
                  </div>
                  <div
                    className="field-row-hover"
                    style={textRowStyle}
                    onClick={() => homePhoneRef.current?.focus()}
                  >
                    <span style={spacerStyle} />
                    <PhoneCall size={16} color="var(--text-muted)" />
                    <span style={labelStyle}>Home</span>
                    <input
                      ref={homePhoneRef}
                      value={homePhone}
                      onChange={(e) => setHomePhone(formatPhone(e.target.value))}
                      type="tel"
                      placeholder="(555) 000-0000"
                      style={inputStyle}
                    />
                  </div>
                  <div
                    className="field-row-hover"
                    style={textRowStyle}
                    onClick={() => emailRef.current?.focus()}
                  >
                    <span style={spacerStyle} />
                    <Envelope size={16} color="var(--text-muted)" />
                    <span style={labelStyle}>Email</span>
                    <input
                      ref={emailRef}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="Email address"
                      style={inputStyle}
                    />
                  </div>
                  <div
                    className="field-row-hover"
                    style={{ ...textRowStyle, alignItems: 'flex-start' }}
                    onClick={() => addressRef.current?.focus()}
                  >
                    <span style={spacerStyle} />
                    <span style={{ paddingTop: 2 }}>
                      <House size={16} color="var(--text-muted)" />
                    </span>
                    <span style={{ ...labelStyle, paddingTop: 2 }}>Address</span>
                    <textarea
                      ref={addressRef}
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                      placeholder="123 Main St, City, State ZIP"
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                    />
                  </div>
                </DrawerSection>

                {/* ── NOTES ── */}
                <DrawerSection label="Notes">
                  <div
                    className="field-row-hover"
                    style={{ ...textRowStyle, alignItems: 'flex-start' }}
                    onClick={() => spiritualRef.current?.focus()}
                  >
                    <span style={spacerStyle} />
                    <span style={{ paddingTop: 2 }}>
                      <Church size={16} color="var(--text-muted)" />
                    </span>
                    <span style={{ ...labelStyle, paddingTop: 2 }}>Spiritual</span>
                    <textarea
                      ref={spiritualRef}
                      value={spiritualNeeds}
                      onChange={(e) => setSpiritualNeeds(e.target.value)}
                      placeholder="Spiritual needs"
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                    />
                  </div>
                  <div
                    className="field-row-hover"
                    style={{ ...textRowStyle, alignItems: 'flex-start' }}
                    onClick={() => physicalRef.current?.focus()}
                  >
                    <span style={spacerStyle} />
                    <span style={{ paddingTop: 2 }}>
                      <FirstAid size={16} color="var(--text-muted)" />
                    </span>
                    <span style={{ ...labelStyle, paddingTop: 2 }}>Physical</span>
                    <textarea
                      ref={physicalRef}
                      value={physicalNeeds}
                      onChange={(e) => setPhysicalNeeds(e.target.value)}
                      placeholder="Physical needs"
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                    />
                  </div>
                </DrawerSection>
              </>
            )}
          </div>
      </BottomSheet>

      {openPicker === 'status' && (
        <PickerMenu
          anchorRef={statusBtnRef}
          title="Membership status"
          options={MEMBERSHIP_OPTIONS}
          value={status}
          onSelect={(v) => setStatus(v as MembershipStatus)}
          onClose={() => setOpenPicker(null)}
        />
      )}
      {openPicker === 'attendance' && (
        <PickerMenu
          anchorRef={attendanceBtnRef}
          title="Church Attendance"
          options={CHURCH_ATTENDANCE_OPTIONS}
          value={attendance}
          onSelect={(v) => setAttendance(v as ChurchAttendance)}
          onClose={() => setOpenPicker(null)}
        />
      )}
      {openPicker === 'gender' && (
        <PickerMenu
          anchorRef={genderBtnRef}
          title="Gender"
          options={GENDER_OPTIONS}
          value={gender}
          onSelect={(v) => setGender(v as Gender | '')}
          onClose={() => setOpenPicker(null)}
        />
      )}
      {openPicker === 'marital' && (
        <PickerMenu
          anchorRef={maritalBtnRef}
          title="Marital Status"
          options={MARITAL_OPTIONS}
          value={maritalStatus}
          onSelect={(v) => setMaritalStatus(v as MaritalStatus | '')}
          onClose={() => setOpenPicker(null)}
        />
      )}
      {showPositionPicker && (
        <PositionPickerSheet
          currentPositions={churchPositions}
          onConfirm={(positions) => {
            setChurchPositions(positions);
            setShowPositionPicker(false);
          }}
          onBack={() => setShowPositionPicker(false)}
        />
      )}
      {showGroupPicker && (
        <GroupPickerSheet
          groups={data.groups}
          currentIds={groupIds}
          onConfirm={(ids) => {
            setGroupIds(ids);
            setShowGroupPicker(false);
          }}
          onBack={() => setShowGroupPicker(false)}
        />
      )}
      {showShepherdPicker && (
        <ShepherdPickerSheet
          entries={shepherdEntries}
          currentIds={shepherdIds}
          onConfirm={(ids) => {
            setShepherdIds(ids);
            setShowShepherdPicker(false);
          }}
          onBack={() => setShowShepherdPicker(false)}
        />
      )}
      {showSheepPickerSheet && (
        <SheepPickerSheet
          people={data.people}
          currentIds={sheepIds}
          onConfirm={(ids) => {
            setSheepIds(ids);
            setShowSheepPickerSheet(false);
          }}
          onBack={() => setShowSheepPickerSheet(false)}
        />
      )}
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const textRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  paddingTop: 12,
  paddingBottom: 12,
  borderBottom: '1px solid var(--border-light)',
  cursor: 'text',
};

const asteriskStyle: React.CSSProperties = {
  width: 10,
  fontSize: 14,
  color: 'var(--red)',
  flexShrink: 0,
  lineHeight: 1,
};

const spacerStyle: React.CSSProperties = {
  width: 10,
  flexShrink: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  width: 60,
  flexShrink: 0,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'none',
  border: 'none',
  outline: 'none',
  fontSize: 14,
  color: 'var(--text-primary)',
};

// ── Sub-components ───────────────────────────────────────────────────────────


function GroupPickerSheet({
  groups,
  currentIds,
  onConfirm,
  onBack,
}: {
  groups: import('@/lib/types').Group[];
  currentIds: string[];
  onConfirm: (ids: string[]) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(currentIds);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const q = search.toLowerCase();
  const filtered = groups.filter((g) => !q || g.name.toLowerCase().includes(q));
  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_SHEET,
        background: BACKDROP_COLOR,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        className="animate-slide-up"
        style={{
          background: 'var(--surface)',
          borderRadius: SHEET_BORDER_RADIUS,
          width: '100%',
          maxWidth: SHEET_MAX_WIDTH,
          height: 'calc(100dvh - 3rem)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: 'var(--border)',
            borderRadius: 2,
            margin: '0.875rem auto 0',
            flexShrink: 0,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1.25rem 0.75rem',
            flexShrink: 0,
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <button
            onClick={onBack}
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Back
          </button>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Fellowship Groups
          </span>
          <button
            onClick={() => onConfirm(selectedIds)}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--sage)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {selectedIds.length > 0 ? `Done (${selectedIds.length})` : 'Done'}
          </button>
        </div>
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
              placeholder="Search groups…"
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
          {filtered.map((g) => {
            const isSel = selectedIds.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => toggle(g.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '0.75rem 1.25rem',
                  background: isSel ? 'var(--blue-light)' : 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: isSel ? 600 : 400,
                      color: isSel ? 'var(--blue)' : 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {g.name}
                  </p>
                </div>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    flexShrink: 0,
                    border: isSel ? 'none' : '0.09375rem solid var(--border)',
                    background: isSel ? 'var(--blue)' : 'transparent',
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
          })}
          {filtered.length === 0 && (
            <p
              style={{
                padding: '1.5rem 1.25rem',
                fontSize: 13,
                color: 'var(--text-muted)',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              No groups found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ShepherdPickerSheet({
  entries,
  currentIds,
  onConfirm,
  onBack,
}: {
  entries: { id: string; name: string; subtitle: string; photo?: string }[];
  currentIds: string[];
  onConfirm: (ids: string[]) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(currentIds);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const q = search.toLowerCase();
  const filtered = entries.filter((e) => !q || e.name.toLowerCase().includes(q));
  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_SHEET,
        background: BACKDROP_COLOR,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        className="animate-slide-up"
        style={{
          background: 'var(--surface)',
          borderRadius: SHEET_BORDER_RADIUS,
          width: '100%',
          maxWidth: SHEET_MAX_WIDTH,
          height: 'calc(100dvh - 3rem)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: 'var(--border)',
            borderRadius: 2,
            margin: '0.875rem auto 0',
            flexShrink: 0,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1.25rem 0.75rem',
            flexShrink: 0,
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <button
            onClick={onBack}
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Back
          </button>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Shepherd
          </span>
          <button
            onClick={() => onConfirm(selectedIds)}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--sage)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {selectedIds.length > 0 ? `Done (${selectedIds.length})` : 'Done'}
          </button>
        </div>
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
              placeholder="Search shepherds…"
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
          {filtered.map((entry, i) => {
            const isSel = selectedIds.includes(entry.id);
            const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
            return (
              <button
                key={entry.id}
                onClick={() => toggle(entry.id)}
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
                <AvatarBadge
                  name={entry.name}
                  photo={entry.photo}
                  size={36}
                  bg={isSel ? 'var(--sage)' : palette.bg}
                  color={isSel ? 'var(--on-sage)' : palette.color}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: isSel ? 600 : 400,
                      color: isSel ? 'var(--sage)' : 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {entry.name}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    {entry.subtitle}
                  </p>
                </div>
                <ShepherdCheckCircle selected={isSel} />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p
              style={{
                padding: '1.5rem 1.25rem',
                fontSize: 13,
                color: 'var(--text-muted)',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              No shepherds found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SheepPickerSheet({
  people,
  currentIds,
  onConfirm,
  onBack,
}: {
  people: { id: string; englishName: string; chineseName?: string; photo?: string }[];
  currentIds: string[];
  onConfirm: (ids: string[]) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(currentIds);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const q = search.toLowerCase();
  const sorted = [
    ...people.filter((p) => selectedIds.includes(p.id)),
    ...people.filter((p) => !selectedIds.includes(p.id)),
  ].filter(
    (p) =>
      !q ||
      p.englishName.toLowerCase().includes(q) ||
      (p.chineseName && p.chineseName.toLowerCase().includes(q))
  );
  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_SHEET,
        background: BACKDROP_COLOR,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        className="animate-slide-up"
        style={{
          background: 'var(--surface)',
          borderRadius: SHEET_BORDER_RADIUS,
          width: '100%',
          maxWidth: SHEET_MAX_WIDTH,
          height: 'calc(100dvh - 3rem)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: 'var(--border)',
            borderRadius: 2,
            margin: '0.875rem auto 0',
            flexShrink: 0,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1.25rem 0.75rem',
            flexShrink: 0,
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <button
            onClick={onBack}
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Back
          </button>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Sheep
          </span>
          <button
            onClick={() => onConfirm(selectedIds)}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--sage)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {selectedIds.length > 0 ? `Done (${selectedIds.length})` : 'Done'}
          </button>
        </div>
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
              placeholder="Search people…"
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
          {sorted.length === 0 && (
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                paddingTop: 24,
                textAlign: 'center',
              }}
            >
              No matching people.
            </p>
          )}
          {sorted.map((p, i) => {
            const isSel = selectedIds.includes(p.id);
            const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
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
                <AvatarBadge
                  name={p.englishName}
                  photo={p.photo}
                  size={36}
                  bg={isSel ? 'var(--sage)' : palette.bg}
                  color={isSel ? 'var(--on-sage)' : palette.color}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: isSel ? 600 : 400,
                      color: isSel ? 'var(--sage)' : 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {p.englishName}
                  </p>
                  {p.chineseName && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                      {p.chineseName}
                    </p>
                  )}
                </div>
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
          })}
        </div>
      </div>
    </div>
  );
}

function ShepherdCheckCircle({ selected }: { selected: boolean }) {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: 5,
        flexShrink: 0,
        border: selected ? 'none' : '0.09375rem solid var(--border)',
        background: selected ? 'var(--sage)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s',
      }}
    >
      {selected && <Check size={11} color="var(--on-sage)" weight="bold" />}
    </div>
  );
}

function PositionPickerSheet({
  currentPositions,
  onConfirm,
  onBack,
}: {
  currentPositions: string[];
  onConfirm: (positions: string[]) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<string[]>(currentPositions);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const q = search.toLowerCase();
  const filtered = CHURCH_POSITIONS.filter((pos) => !q || pos.toLowerCase().includes(q));
  const toggle = (pos: string) =>
    setSelectedPositions((prev) =>
      prev.includes(pos) ? prev.filter((x) => x !== pos) : [...prev, pos]
    );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_SHEET,
        background: BACKDROP_COLOR,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        className="animate-slide-up"
        style={{
          background: 'var(--surface)',
          borderRadius: SHEET_BORDER_RADIUS,
          width: '100%',
          maxWidth: SHEET_MAX_WIDTH,
          height: 'calc(100dvh - 3rem)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: 'var(--border)',
            borderRadius: 2,
            margin: '0.875rem auto 0',
            flexShrink: 0,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1.25rem 0.75rem',
            flexShrink: 0,
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <button
            onClick={onBack}
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Back
          </button>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Church Position
          </span>
          <button
            onClick={() => onConfirm(selectedPositions)}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--sage)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {selectedPositions.length > 0 ? `Done (${selectedPositions.length})` : 'Done'}
          </button>
        </div>
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
              placeholder="Search positions…"
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
          {filtered.map((pos) => {
            const isSel = selectedPositions.includes(pos);
            return (
              <button
                key={pos}
                onClick={() => toggle(pos)}
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: isSel ? 600 : 400,
                      color: isSel ? 'var(--sage)' : 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {pos}
                  </p>
                </div>
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
          })}
          {filtered.length === 0 && (
            <p
              style={{
                padding: '1.5rem 1.25rem',
                fontSize: 13,
                color: 'var(--text-muted)',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              No positions found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
