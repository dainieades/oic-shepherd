'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { formatPhone, fmtDate } from '@/lib/utils';
import {
  type Person,
  type MembershipStatus,
  type ChurchAttendance,
  type Gender,
  type MaritalStatus,
  CHURCH_POSITIONS,
  type AppRole,
} from '@/lib/types';
import PickerMenu from './PickerMenu';
import AppRolePickerSheet from './AppRolePickerSheet';
import LanguagePickerSheet from './LanguagePickerSheet';
import InviteSheet from './InviteSheet';
import {
  User,
  TextT,
  Globe,
  Pulse,
  GenderIntersex,
  Cake,
  Heart,
  Sparkle,
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
  CaretRight,
  HandHeart,
  UsersFour,
  PaperPlaneTilt,
  MagnifyingGlass,
  Check,
  Camera,
} from '@phosphor-icons/react';
import {
  BACKDROP_COLOR,
  SHEET_MAX_WIDTH,
  SHEET_BORDER_RADIUS,
  SHEPHERD_AVATAR_PALETTE,
} from '@/lib/constants';

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

export interface PersonFormBodyHandle {
  save: () => Promise<void>;
}

interface Props {
  person: Person;
  onSaved: () => void;
  showPhotoUpload?: boolean;
  showInviteRow?: boolean;
  onValidityChange?: (valid: boolean) => void;
}

const PersonFormBody = React.forwardRef<PersonFormBodyHandle, Props>(
  function PersonFormBody({ person, onSaved, showPhotoUpload, showInviteRow, onValidityChange }, ref) {
    const { data, currentPersona, updatePerson, assignShepherds, assignGroupsToPerson } = useApp();

    const _nameParts = person.englishName.trim().split(/\s+/);
    const [firstName, setFirstName] = React.useState(_nameParts[0] ?? '');
    const [lastName, setLastName] = React.useState(_nameParts.slice(1).join(' '));
    const [chineseName, setChineseName] = React.useState(person.chineseName ?? '');
    const [photo, setPhoto] = React.useState(person.photo ?? '');

    const [language, setLanguage] = React.useState<string[]>(person.language ?? []);
    const [gender, setGender] = React.useState<Gender | ''>(person.gender ?? '');
    const [birthday, setBirthday] = React.useState(person.birthday ?? '');
    const [maritalStatus, setMaritalStatus] = React.useState<MaritalStatus | ''>(
      person.maritalStatus ?? ''
    );
    const [anniversary, setAnniversary] = React.useState(person.anniversary ?? '');

    const [groupIds, setGroupIds] = React.useState<string[]>(person.groupIds ?? []);
    const [shepherdIds, setShepherdIds] = React.useState<string[]>(person.assignedShepherdIds ?? []);
    const [status, setStatus] = React.useState<MembershipStatus>(person.membershipStatus);
    const [attendance, setAttendance] = React.useState<ChurchAttendance>(person.churchAttendance);
    const [membershipDate, setMembershipDate] = React.useState(person.membershipDate ?? '');
    const [baptismDate, setBaptismDate] = React.useState(person.baptismDate ?? '');
    const [isShepherd, setIsShepherd] = React.useState(person.isShepherd ?? false);
    const [isBeingDiscipled, setIsBeingDiscipled] = React.useState(person.isBeingDiscipled ?? false);
    const [appRole, setAppRole] = React.useState<AppRole>(person.appRole ?? 'no-access');
    const [churchPositions, setChurchPositions] = React.useState<string[]>(
      person.churchPositions ?? []
    );

    const [phone, setPhone] = React.useState(person.phone ? formatPhone(person.phone) : '');
    const [homePhone, setHomePhone] = React.useState(
      person.homePhone ? formatPhone(person.homePhone) : ''
    );
    const [email, setEmail] = React.useState(person.email ?? '');
    const [homeAddress, setHomeAddress] = React.useState(person.homeAddress ?? '');

    const firstNameRef = React.useRef<HTMLInputElement>(null);
    const lastNameRef = React.useRef<HTMLInputElement>(null);
    const chineseRef = React.useRef<HTMLInputElement>(null);
    const phoneRef = React.useRef<HTMLInputElement>(null);
    const homePhoneRef = React.useRef<HTMLInputElement>(null);
    const emailRef = React.useRef<HTMLInputElement>(null);
    const addressRef = React.useRef<HTMLTextAreaElement>(null);
    const birthdayRef = React.useRef<HTMLInputElement>(null);
    const anniversaryRef = React.useRef<HTMLInputElement>(null);
    const membershipDateRef = React.useRef<HTMLInputElement>(null);
    const baptismDateRef = React.useRef<HTMLInputElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const statusBtnRef = React.useRef<HTMLButtonElement>(null);
    const attendanceBtnRef = React.useRef<HTMLButtonElement>(null);
    const genderBtnRef = React.useRef<HTMLButtonElement>(null);
    const maritalBtnRef = React.useRef<HTMLButtonElement>(null);

    const [openPicker, setOpenPicker] = React.useState<
      'status' | 'attendance' | 'gender' | 'marital' | 'appRole' | null
    >(null);
    const [showLanguagePicker, setShowLanguagePicker] = React.useState(false);
    const [showInvite, setShowInvite] = React.useState(false);
    const [showPositionPicker, setShowPositionPicker] = React.useState(false);
    const [showGroupPicker, setShowGroupPicker] = React.useState(false);
    const [showShepherdPicker, setShowShepherdPicker] = React.useState(false);
    const [showSheepPicker, setShowSheepPicker] = React.useState(false);

    const initShepherdPersona = person.isShepherd
      ? data.personas.find((p) => p.personId === person.id)
      : null;
    const shepherdId = initShepherdPersona?.id ?? (person.isShepherd ? person.id : null);
    const [sheepIds, setSheepIds] = React.useState<string[]>(() =>
      shepherdId ? data.people.filter((p) => p.assignedShepherdIds.includes(shepherdId)).map((p) => p.id) : []
    );

    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    const selectedGroups = data.groups.filter((g) => groupIds.includes(g.id));

    const personaPersonIds = new Set(data.personas.map((p) => p.personId).filter(Boolean));
    type ShepherdEntry = { id: string; name: string; subtitle: string };
    const shepherdEntries: ShepherdEntry[] = [
      ...data.personas
        .filter((p) => p.role === 'shepherd' || p.role === 'admin')
        .map((p) => ({
          id: p.id,
          name: p.name,
          subtitle: p.role === 'admin' ? 'Pastor' : 'Shepherd',
        })),
      ...data.people
        .filter((p) => p.isShepherd && !personaPersonIds.has(p.id))
        .map((p) => ({ id: p.id, name: p.englishName, subtitle: 'Shepherd' })),
    ];

    const statusLabel = MEMBERSHIP_OPTIONS.find((o) => o.value === status)?.label ?? '';
    const attendanceLabel =
      CHURCH_ATTENDANCE_OPTIONS.find((o) => o.value === attendance)?.label ?? attendance;
    const genderLabel = GENDER_OPTIONS.find((o) => o.value === gender)?.label ?? 'Not set';
    const maritalLabel = MARITAL_OPTIONS.find((o) => o.value === maritalStatus)?.label ?? 'Not set';
    const initials = fullName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    React.useEffect(() => {
      onValidityChange?.(!!firstName.trim());
    }, [firstName, onValidityChange]);

    const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setPhoto(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    };

    React.useImperativeHandle(ref, () => ({
      save: async () => {
        if (!firstName.trim()) return;
        await assignGroupsToPerson(person.id, groupIds);
        await assignShepherds(person.id, shepherdIds);
        if (shepherdId) {
          const originalSheepIds = data.people
            .filter((p) => p.assignedShepherdIds.includes(shepherdId))
            .map((p) => p.id);
          const added = sheepIds.filter((id) => !originalSheepIds.includes(id));
          const removed = originalSheepIds.filter((id) => !sheepIds.includes(id));
          for (const id of added) {
            const p = data.people.find((p) => p.id === id);
            if (p) await assignShepherds(id, [...p.assignedShepherdIds, shepherdId]);
          }
          for (const id of removed) {
            const p = data.people.find((p) => p.id === id);
            if (p) await assignShepherds(id, p.assignedShepherdIds.filter((sid) => sid !== shepherdId));
          }
        }
        await updatePerson(person.id, {
          englishName: fullName,
          chineseName: chineseName.trim() || undefined,
          ...(showPhotoUpload ? { photo: photo || undefined } : {}),
          language,
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
          appRole,
          churchPositions: churchPositions.length > 0 ? churchPositions : undefined,
          phone: phone.trim() || undefined,
          homePhone: homePhone.trim() || undefined,
          email: email.trim() || undefined,
          homeAddress: homeAddress.trim() || undefined,
        });
        onSaved();
      },
    }));

    return (
      <>
        {showPhotoUpload && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px 0 20px' }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt={fullName}
                  style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'var(--sage)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  {initials}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'var(--text-secondary)',
                  border: '2px solid var(--bg)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Camera size={12} weight="fill" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoFile}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {fullName || 'Your Name'}
              </p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {(currentPersona.role === 'admin' ||
            (currentPersona.role === 'shepherd' &&
              (appRole === 'shepherd' || appRole === 'no-access'))) && (
            <FormSection label="Access">
              {showInviteRow && appRole === 'no-access' ? (
                <button
                  className="field-row-hover"
                  onClick={() => setShowInvite(true)}
                  style={rowBtnStyle}
                >
                  <span style={spacerStyle} />
                  <PaperPlaneTilt size={16} color="var(--text-muted)" />
                  <span style={labelStyle}>Invite</span>
                  <span
                    style={{ flex: 1, fontSize: 14, color: 'var(--sage)', textAlign: 'right' }}
                  >
                    Give app access…
                  </span>
                  <CaretRight size={14} color="var(--text-muted)" />
                </button>
              ) : (
                <button
                  className={currentPersona.role === 'admin' ? 'field-row-hover' : undefined}
                  onClick={() => currentPersona.role === 'admin' && setOpenPicker('appRole')}
                  style={{
                    ...rowBtnStyle,
                    cursor: currentPersona.role === 'admin' ? 'pointer' : 'default',
                  }}
                >
                  <span style={spacerStyle} />
                  <IdentificationCard size={16} color="var(--text-muted)" />
                  <span style={labelStyle}>App Role</span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: 'var(--text-primary)',
                      textAlign: 'right',
                    }}
                  >
                    {
                      {
                        admin: 'Admin',
                        shepherd: 'Shepherd',
                        'welcome-team': 'Welcome Team',
                        'no-access': 'No Access',
                      }[appRole]
                    }
                  </span>
                  {currentPersona.role === 'admin' && (
                    <CaretRight size={14} color="var(--text-muted)" />
                  )}
                </button>
              )}
            </FormSection>
          )}

          <FormSection label="Basic">
            <TextInputRow
              icon={<User size={16} color="var(--text-muted)" />}
              label="Preferred"
              required
              inputRef={firstNameRef}
              value={firstName}
              onChange={setFirstName}
              placeholder="Preferred name"
            />
            <TextInputRow
              icon={<User size={16} color="var(--text-muted)" style={{ opacity: 0 }} />}
              label="Last"
              inputRef={lastNameRef}
              value={lastName}
              onChange={setLastName}
              placeholder="Last name"
            />
            <TextInputRow
              icon={<TextT size={16} color="var(--text-muted)" />}
              label="Alt. name"
              inputRef={chineseRef}
              value={chineseName}
              onChange={setChineseName}
              placeholder="Legal name, 中文名…"
            />
          </FormSection>

          <FormSection label="Personal">
            <button
              className="field-row-hover"
              onClick={() => setShowLanguagePicker(true)}
              style={rowBtnStyle}
            >
              <span style={spacerStyle} />
              <Globe size={16} color="var(--text-muted)" />
              <span style={labelStyle}>Language</span>
              <span style={{ flex: 1, fontSize: 14, color: language.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {language.length > 0 ? language.join(', ') : 'None'}
              </span>
              <CaretRight size={14} color="var(--text-muted)" />
            </button>
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
          </FormSection>

          <FormSection label="Church">
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
              style={rowBtnStyle}
            >
              <span style={spacerStyle} />
              <UsersFour size={16} color="var(--text-muted)" />
              <span style={labelStyle}>Groups</span>
              <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {selectedGroups.length > 0 ? (
                  selectedGroups.map((g) => (
                    <span key={g.id} style={blueChipStyle}>
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
              style={rowBtnStyle}
            >
              <span style={spacerStyle} />
              <HandHeart size={16} color="var(--text-muted)" />
              <span style={labelStyle}>Shepherd by</span>
              <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {shepherdIds.length > 0 ? (
                  shepherdEntries
                    .filter((e) => shepherdIds.includes(e.id))
                    .map((e) => (
                      <span key={e.id} style={sageChipStyle}>
                        {e.name}
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
              style={rowBtnStyle}
            >
              <span style={spacerStyle} />
              <Compass size={16} color="var(--text-muted)" />
              <span style={{ ...labelStyle, flex: 1 }}>Is Shepherd?</span>
              <Toggle on={isShepherd} />
            </button>
            {isShepherd && shepherdId && (
              <button
                className="field-row-hover"
                onClick={() => setShowSheepPicker(true)}
                style={rowBtnStyle}
              >
                <span style={spacerStyle} />
                <HandHeart size={16} color="var(--text-muted)" />
                <span style={labelStyle}>Sheep</span>
                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {sheepIds.length > 0 ? (
                    data.people
                      .filter((p) => sheepIds.includes(p.id))
                      .map((p) => (
                        <span key={p.id} style={sageChipStyle}>
                          {p.englishName}
                        </span>
                      ))
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
              style={rowBtnStyle}
            >
              <span style={spacerStyle} />
              <BookOpenText size={16} color="var(--text-muted)" />
              <span style={{ ...labelStyle, flex: 1 }}>Being discipled?</span>
              <Toggle on={isBeingDiscipled} />
            </button>
            <button
              className="field-row-hover"
              onClick={() => setShowPositionPicker(true)}
              style={rowBtnStyle}
            >
              <span style={spacerStyle} />
              <Buildings size={16} color="var(--text-muted)" />
              <span style={labelStyle}>Position</span>
              <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {churchPositions.length > 0 ? (
                  churchPositions.map((p) => (
                    <span key={p} style={sageChipStyle}>
                      {p}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>None</span>
                )}
              </div>
              <CaretRight size={14} color="var(--text-muted)" />
            </button>
            <DateRow
              icon={<Drop size={16} color="var(--text-muted)" />}
              label="Baptism Date"
              value={baptismDate}
              inputRef={baptismDateRef}
              onChange={setBaptismDate}
            />
          </FormSection>

          <FormSection label="Contact">
            <TextInputRow
              icon={<Phone size={16} color="var(--text-muted)" />}
              label="Phone"
              inputRef={phoneRef}
              value={phone}
              onChange={(v) => setPhone(formatPhone(v))}
              placeholder="(555) 000-0000"
              type="tel"
            />
            <TextInputRow
              icon={<PhoneCall size={16} color="var(--text-muted)" />}
              label="Home"
              inputRef={homePhoneRef}
              value={homePhone}
              onChange={(v) => setHomePhone(formatPhone(v))}
              placeholder="(555) 000-0000"
              type="tel"
            />
            <TextInputRow
              icon={<Envelope size={16} color="var(--text-muted)" />}
              label="Email"
              inputRef={emailRef}
              value={email}
              onChange={setEmail}
              placeholder="Email address"
              type="email"
            />
            <TextareaRow
              icon={<House size={16} color="var(--text-muted)" />}
              label="Address"
              inputRef={addressRef}
              value={homeAddress}
              onChange={setHomeAddress}
              placeholder="123 Main St, City, State ZIP"
              rows={2}
              resizable
            />
          </FormSection>
        </div>

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
        {openPicker === 'appRole' && (
          <AppRolePickerSheet
            currentRole={appRole}
            onSelect={(role) => {
              setAppRole(role);
              setOpenPicker(null);
            }}
            onRemove={() => {
              setAppRole('no-access');
              setOpenPicker(null);
            }}
            onClose={() => setOpenPicker(null)}
            isAdmin={currentPersona.role === 'admin'}
            personName={person.englishName.split(' ')[0]}
          />
        )}
        {showLanguagePicker && (
          <LanguagePickerSheet
            currentLanguages={language}
            onConfirm={(langs) => {
              setLanguage(langs);
              setShowLanguagePicker(false);
            }}
            onBack={() => setShowLanguagePicker(false)}
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
        {showSheepPicker && shepherdId && (
          <SheepPickerSheet
            people={data.people.filter((p) => p.id !== person.id)}
            currentIds={sheepIds}
            onConfirm={(ids) => {
              setSheepIds(ids);
              setShowSheepPicker(false);
            }}
            onBack={() => setShowSheepPicker(false)}
          />
        )}
        {showInviteRow && showInvite && (
          <InviteSheet
            onClose={() => setShowInvite(false)}
            initialEmail={person.email ?? ''}
            initialRole="shepherd"
            personName={person.englishName}
            personId={person.id}
          />
        )}
      </>
    );
  }
);

export default PersonFormBody;

// ── Styles ────────────────────────────────────────────────────────────────────

const rowBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  paddingTop: 12,
  paddingBottom: 12,
  paddingRight: 16,
  border: 'none',
  borderBottom: '1px solid var(--border-light)',
  background: 'none',
  cursor: 'pointer',
  textAlign: 'left' as const,
};

const spacerStyle: React.CSSProperties = { width: 8, flexShrink: 0 };

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  width: 76,
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

const langChipStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  padding: '2px 8px',
  borderRadius: 999,
  background: 'var(--blue-light)',
  color: 'var(--blue)',
  flexShrink: 0,
};

const blueChipStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  padding: '2px 8px',
  borderRadius: 999,
  background: 'var(--blue-light)',
  color: 'var(--blue)',
  flexShrink: 0,
};

const sageChipStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  padding: '2px 8px',
  borderRadius: 999,
  background: 'var(--sage-light)',
  color: 'var(--sage)',
  flexShrink: 0,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
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
          padding: '0 20px',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function TextInputRow({
  icon,
  label,
  required,
  inputRef,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div
      className="field-row-hover"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingTop: 12,
        paddingBottom: 12,
        paddingRight: 16,
        borderBottom: '1px solid var(--border-light)',
        cursor: 'text',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <span
        style={{ width: 8, fontSize: 14, color: 'var(--red)', flexShrink: 0, lineHeight: 1 }}
      >
        {required ? '*' : ''}
      </span>
      {icon}
      <span style={labelStyle}>{label}</span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

function TextareaRow({
  icon,
  label,
  inputRef,
  value,
  onChange,
  placeholder,
  rows,
  resizable,
}: {
  icon: React.ReactNode;
  label: string;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  resizable?: boolean;
}) {
  return (
    <div
      className="field-row-hover"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        paddingTop: 12,
        paddingBottom: 12,
        paddingRight: 16,
        borderBottom: '1px solid var(--border-light)',
        cursor: 'text',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <span style={{ width: 8, flexShrink: 0 }} />
      <span style={{ paddingTop: 2 }}>{icon}</span>
      <span style={{ ...labelStyle, paddingTop: 2 }}>{label}</span>
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ ...inputStyle, resize: resizable ? 'vertical' : 'none', lineHeight: 1.5 }}
      />
    </div>
  );
}

const PickerRow = React.forwardRef<
  HTMLButtonElement,
  { icon: React.ReactNode; label: string; value: string; onClick: () => void }
>(function PickerRow({ icon, label, value, onClick }, ref) {
  return (
    <button ref={ref} className="field-row-hover" onClick={onClick} style={rowBtnStyle}>
      <span style={spacerStyle} />
      {icon}
      <span style={labelStyle}>{label}</span>
      <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', textAlign: 'left' }}>
        {value}
      </span>
      <CaretRight size={14} color="var(--text-muted)" />
    </button>
  );
});

function DateRow({
  icon,
  label,
  value,
  inputRef,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
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
      <span
        style={{
          flex: 1,
          fontSize: 14,
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          textAlign: 'left',
        }}
      >
        {value ? fmtDate(value) : 'Not set'}
      </span>
      <CaretRight size={14} color="var(--text-muted)" />
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          width: '100%',
          opacity: 0,
          pointerEvents: 'none',
          height: 1,
        }}
      />
    </button>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div
      style={{
        width: 42,
        height: 24,
        borderRadius: 12,
        background: on ? 'var(--sage)' : 'var(--border)',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 21 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
        }}
      />
    </div>
  );
}

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
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>(currentIds);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
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
        zIndex: 70,
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
          height: 'calc(100dvh - 48px)',
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
            margin: '14px auto 0',
            flexShrink: 0,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px 12px',
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
            padding: '12px 20px',
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
              borderRadius: 10,
              padding: '9px 12px',
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
                  padding: '12px 20px',
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
                    border: isSel ? 'none' : '1.5px solid var(--border)',
                    background: isSel ? 'var(--blue)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}
                >
                  {isSel && <Check size={11} color="#fff" weight="bold" />}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p
              style={{
                padding: '24px 20px',
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

function SheepPickerSheet({
  people,
  currentIds,
  onConfirm,
  onBack,
}: {
  people: { id: string; englishName: string; chineseName?: string }[];
  currentIds: string[];
  onConfirm: (ids: string[]) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>(currentIds);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
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
        zIndex: 70,
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
          height: 'calc(100dvh - 48px)',
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
            margin: '14px auto 0',
            flexShrink: 0,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px 12px',
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
            padding: '12px 20px',
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
              borderRadius: 10,
              padding: '9px 12px',
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
            const initials = p.englishName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 20px',
                  background: isSel ? 'var(--sage-light)' : 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: isSel ? 'var(--sage)' : palette.bg,
                    color: isSel ? '#fff' : palette.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {initials}
                </div>
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
                    border: isSel ? 'none' : '1.5px solid var(--border)',
                    background: isSel ? 'var(--sage)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}
                >
                  {isSel && <Check size={11} color="#fff" weight="bold" />}
                </div>
              </button>
            );
          })}
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
  entries: { id: string; name: string; subtitle: string }[];
  currentIds: string[];
  onConfirm: (ids: string[]) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>(currentIds);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
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
        zIndex: 70,
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
          height: 'calc(100dvh - 48px)',
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
            margin: '14px auto 0',
            flexShrink: 0,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px 12px',
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
            padding: '12px 20px',
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
              borderRadius: 10,
              padding: '9px 12px',
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
            const initials = entry.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            return (
              <button
                key={entry.id}
                onClick={() => toggle(entry.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 20px',
                  background: isSel ? 'var(--sage-light)' : 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: isSel ? 'var(--sage)' : palette.bg,
                    color: isSel ? '#fff' : palette.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {initials}
                </div>
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
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    flexShrink: 0,
                    border: isSel ? 'none' : '1.5px solid var(--border)',
                    background: isSel ? 'var(--sage)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}
                >
                  {isSel && <Check size={11} color="#fff" weight="bold" />}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p
              style={{
                padding: '24px 20px',
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

function PositionPickerSheet({
  currentPositions,
  onConfirm,
  onBack,
}: {
  currentPositions: string[];
  onConfirm: (positions: string[]) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = React.useState('');
  const [selectedPositions, setSelectedPositions] = React.useState<string[]>(currentPositions);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
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
        zIndex: 70,
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
          height: 'calc(100dvh - 48px)',
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
            margin: '14px auto 0',
            flexShrink: 0,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px 12px',
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
            padding: '12px 20px',
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
              borderRadius: 10,
              padding: '9px 12px',
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
                  padding: '12px 20px',
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
                    border: isSel ? 'none' : '1.5px solid var(--border)',
                    background: isSel ? 'var(--sage)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}
                >
                  {isSel && <Check size={11} color="#fff" weight="bold" />}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p
              style={{
                padding: '24px 20px',
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
