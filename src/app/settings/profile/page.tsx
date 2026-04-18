'use client';

import { format } from 'date-fns';
import React from 'react';
import { useRouter } from 'next/navigation';
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
  Camera,
  UsersFour,
  CaretLeft,
  Check,
} from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { formatPhone } from '@/lib/utils';
import {
  type MembershipStatus,
  type ChurchAttendance,
  type Gender,
  type MaritalStatus,
  CHURCH_POSITIONS,
  type AppRole,
} from '@/lib/types';
import PickerMenu from '@/components/PickerMenu';
import AppRolePickerSheet from '@/components/AppRolePickerSheet';
import LanguagePickerSheet from '@/components/LanguagePickerSheet';

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

function fmtDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return format(new Date(y, m - 1, d), 'MMM d, yyyy');
}

export default function SettingsProfilePage() {
  const router = useRouter();
  const { data, currentPersona } = useApp();
  const person = currentPersona.personId
    ? data.people.find((p) => p.id === currentPersona.personId)
    : null;

  if (!person) {
    return (
      <div style={{ minHeight: '100dvh' }}>
        <div style={navBarStyle}>
          <button onClick={() => router.back()} style={backBtnStyle}>
            <CaretLeft size={16} />
            Settings
          </button>
          <span style={navTitleStyle}>My Profile</span>
          <span style={{ width: 64 }} />
        </div>
        <div
          style={{
            padding: '40px 0',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 14,
          }}
        >
          No profile linked to this account.
        </div>
      </div>
    );
  }

  return <ProfileEditor personId={person.id} onBack={() => router.back()} />;
}

function ProfileEditor({ personId, onBack }: { personId: string; onBack: () => void }) {
  const { data, currentPersona, updatePerson, assignShepherds, assignGroupsToPerson } = useApp();
  const person = data.people.find((p) => p.id === personId)!;

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
  const [churchPositions, setChurchPositions] = React.useState<string[]>(person.churchPositions ?? []);

  const [phone, setPhone] = React.useState(person.phone ? formatPhone(person.phone) : '');
  const [homePhone, setHomePhone] = React.useState(person.homePhone ? formatPhone(person.homePhone) : '');
  const [email, setEmail] = React.useState(person.email ?? '');
  const [homeAddress, setHomeAddress] = React.useState(person.homeAddress ?? '');
  const [spiritualNeeds] = React.useState(person.spiritualNeeds ?? '');
  const [physicalNeeds] = React.useState(person.physicalNeeds ?? '');

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

  const [openPicker, setOpenPicker] = React.useState<
    'status' | 'attendance' | 'gender' | 'marital' | 'appRole' | null
  >(null);
  const [showLanguagePicker, setShowLanguagePicker] = React.useState(false);
  const [appRole, setAppRole] = React.useState<AppRole>(person.appRole ?? 'no-access');
  const [showPositionPicker, setShowPositionPicker] = React.useState(false);
  const [showGroupPicker, setShowGroupPicker] = React.useState(false);
  const [showShepherdPicker, setShowShepherdPicker] = React.useState(false);

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setPhoto(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

  const handleSave = async () => {
    if (!firstName.trim()) return;
    await assignGroupsToPerson(person.id, groupIds);
    await assignShepherds(person.id, shepherdIds);
    await updatePerson(person.id, {
      englishName: fullName,
      chineseName: chineseName.trim() || undefined,
      photo: photo || undefined,
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
      spiritualNeeds: spiritualNeeds.trim() || undefined,
      physicalNeeds: physicalNeeds.trim() || undefined,
    });
    onBack();
  };

  const togglePosition = (pos: string) =>
    setChurchPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    );

  const toggleGroup = (id: string) =>
    setGroupIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectedGroups = data.groups.filter((g) => groupIds.includes(g.id));

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

  return (
    <>
      {/* ── Fixed header ── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border-light)',
          height: 54,
        }}
      >
        <div
          style={{
            maxWidth: 430,
            margin: '0 auto',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
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
            Cancel
          </button>
          <span style={navTitleStyle}>My Profile</span>
          <button
            onClick={handleSave}
            disabled={!firstName.trim()}
            style={{
              height: 32,
              padding: '0 14px',
              borderRadius: 8,
              background: firstName.trim() ? 'var(--sage)' : 'var(--border)',
              color: firstName.trim() ? '#fff' : 'var(--text-muted)',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: firstName.trim() ? 'pointer' : 'default',
              transition: 'background 0.15s',
            }}
          >
            Save
          </button>
        </div>
      </div>

      {/* Spacer to push content below fixed header */}
      <div style={{ height: 54 }} />

      {/* ── Hero: avatar only ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px 0 20px' }}>
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

      {/* ── Form sections — white cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* ── ACCESS ── */}
        {(currentPersona.role === 'admin' ||
          (currentPersona.role === 'shepherd' &&
            (appRole === 'shepherd' || appRole === 'no-access'))) && (
          <FormSection label="Access">
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
                style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', textAlign: 'right' }}
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
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {language.length > 0 ? (
                language.map((l) => (
                  <span
                    key={l}
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: 'var(--blue-light)',
                      color: 'var(--blue)',
                      flexShrink: 0,
                    }}
                  >
                    {l}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>None</span>
              )}
            </div>
            <CaretRight size={14} color="var(--text-muted)" />
          </button>
          <PickerRow
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
            icon={<IdentificationCard size={16} color="var(--text-muted)" />}
            label="Status"
            value={statusLabel}
            onClick={() => setOpenPicker('status')}
          />
          <PickerRow
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
                  <span key={g.id} style={chipStyle}>
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
                data.personas
                  .filter((p) => shepherdIds.includes(p.id))
                  .map((p) => (
                    <span key={p.id} style={chipStyle}>
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
            style={rowBtnStyle}
          >
            <span style={spacerStyle} />
            <Compass size={16} color="var(--text-muted)" />
            <span style={{ ...labelStyle, flex: 1 }}>Is Shepherd?</span>
            <div
              style={{
                width: 42,
                height: 24,
                borderRadius: 12,
                background: isShepherd ? 'var(--sage)' : 'var(--border)',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
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
                  background: '#fff',
                  transition: 'left 0.2s',
                }}
              />
            </div>
          </button>
          <button
            className="field-row-hover"
            onClick={() => setIsBeingDiscipled((v) => !v)}
            style={rowBtnStyle}
          >
            <span style={spacerStyle} />
            <BookOpenText size={16} color="var(--text-muted)" />
            <span style={{ ...labelStyle, flex: 1 }}>Being discipled?</span>
            <div
              style={{
                width: 42,
                height: 24,
                borderRadius: 12,
                background: isBeingDiscipled ? 'var(--sage)' : 'var(--border)',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
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
                  background: '#fff',
                  transition: 'left 0.2s',
                }}
              />
            </div>
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
                  <span key={p} style={chipStyle}>
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

      {/* Pickers */}
      {openPicker === 'status' && (
        <PickerMenu
          title="Membership status"
          options={MEMBERSHIP_OPTIONS}
          value={status}
          onSelect={(v) => setStatus(v as MembershipStatus)}
          onClose={() => setOpenPicker(null)}
        />
      )}
      {openPicker === 'attendance' && (
        <PickerMenu
          title="Church Attendance"
          options={CHURCH_ATTENDANCE_OPTIONS}
          value={attendance}
          onSelect={(v) => setAttendance(v as ChurchAttendance)}
          onClose={() => setOpenPicker(null)}
        />
      )}
      {openPicker === 'gender' && (
        <PickerMenu
          title="Gender"
          options={GENDER_OPTIONS}
          value={gender}
          onSelect={(v) => setGender(v as Gender | '')}
          onClose={() => setOpenPicker(null)}
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
      {openPicker === 'marital' && (
        <PickerMenu
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
      {showPositionPicker && (
        <PositionPickerSheet
          selected={churchPositions}
          onToggle={togglePosition}
          onDone={() => setShowPositionPicker(false)}
        />
      )}
      {showGroupPicker && (
        <GroupPickerSheet
          groups={data.groups}
          selected={groupIds}
          onToggle={toggleGroup}
          onDone={() => setShowGroupPicker(false)}
        />
      )}
      {showShepherdPicker && (
        <ShepherdPickerSheet
          personas={data.personas}
          selected={shepherdIds}
          onToggle={(id) =>
            setShepherdIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          onDone={() => setShowShepherdPicker(false)}
        />
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const navBarStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 30,
  background: 'var(--bg)',
  marginLeft: -16,
  marginRight: -16,
  paddingLeft: 16,
  paddingRight: 16,
  borderBottom: '1px solid var(--border-light)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 54,
};
const backBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 13,
  color: 'var(--sage)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
};
const navTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--text-primary)',
};
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
const chipStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  padding: '2px 8px',
  borderRadius: 999,
  background: 'var(--sage-light)',
  color: 'var(--sage)',
  flexShrink: 0,
};

// ── Form components ───────────────────────────────────────────────────────────

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
      <span style={{ width: 8, fontSize: 14, color: 'var(--red)', flexShrink: 0, lineHeight: 1 }}>
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

function PickerRow({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button className="field-row-hover" onClick={onClick} style={rowBtnStyle}>
      <span style={spacerStyle} />
      {icon}
      <span style={labelStyle}>{label}</span>
      <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', textAlign: 'left' }}>
        {value}
      </span>
      <CaretRight size={14} color="var(--text-muted)" />
    </button>
  );
}

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

function GroupPickerSheet({
  groups,
  selected,
  onToggle,
  onDone,
}: {
  groups: import('@/lib/types').Group[];
  selected: string[];
  onToggle: (id: string) => void;
  onDone: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        background: 'rgba(30,26,24,0.35)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDone();
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '16px 16px 0 0',
          width: '100%',
          maxWidth: 430,
          maxHeight: '60dvh',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 'env(safe-area-inset-bottom, 24px)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: 'var(--border)',
            borderRadius: 2,
            margin: '12px auto 0',
            flexShrink: 0,
          }}
        />
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '12px 20px 10px',
            borderBottom: '1px solid var(--border-light)',
            flexShrink: 0,
          }}
        >
          Fellowship Groups
        </p>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {groups.map((g) => {
            const isSel = selected.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => onToggle(g.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
                  background: isSel ? 'var(--blue-light)' : 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: isSel ? 600 : 400,
                    color: isSel ? 'var(--blue)' : 'var(--text-primary)',
                  }}
                >
                  {g.name}
                </span>
                {isSel && <Check size={16} color="var(--blue)" weight="bold" />}
              </button>
            );
          })}
        </div>
        <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
          <button
            onClick={onDone}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 12,
              background: 'var(--sage)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ShepherdPickerSheet({
  personas,
  selected,
  onToggle,
  onDone,
}: {
  personas: import('@/lib/types').Persona[];
  selected: string[];
  onToggle: (id: string) => void;
  onDone: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        background: 'rgba(30,26,24,0.35)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDone();
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '16px 16px 0 0',
          width: '100%',
          maxWidth: 430,
          paddingBottom: 'env(safe-area-inset-bottom, 24px)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: 'var(--border)',
            borderRadius: 2,
            margin: '12px auto 0',
          }}
        />
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '12px 20px 10px',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          Assign Shepherd
        </p>
        {personas.map((p) => {
          const isSel = selected.includes(p.id);
          const ini = p.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          return (
            <button
              key={p.id}
              onClick={() => onToggle(p.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                background: isSel ? 'var(--sage-light)' : 'none',
                border: 'none',
                borderBottom: '1px solid var(--border-light)',
                cursor: 'pointer',
                textAlign: 'left' as const,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isSel ? 'var(--sage)' : 'var(--bg)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: isSel ? '#fff' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  {ini}
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: isSel ? 600 : 400,
                      color: isSel ? 'var(--sage)' : 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {p.name}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      margin: 0,
                      textTransform: 'capitalize',
                    }}
                  >
                    {p.role}
                  </p>
                </div>
              </div>
              {isSel && <Check size={16} color="var(--sage)" weight="bold" />}
            </button>
          );
        })}
        <div style={{ padding: '16px 20px 0' }}>
          <button
            onClick={onDone}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 12,
              background: 'var(--sage)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function PositionPickerSheet({
  selected,
  onToggle,
  onDone,
}: {
  selected: string[];
  onToggle: (pos: string) => void;
  onDone: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        background: 'rgba(30,26,24,0.35)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDone();
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '16px 16px 0 0',
          width: '100%',
          maxWidth: 430,
          paddingBottom: 'env(safe-area-inset-bottom, 24px)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: 'var(--border)',
            borderRadius: 2,
            margin: '12px auto 0',
          }}
        />
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '12px 20px 10px',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          Church Position
        </p>
        {CHURCH_POSITIONS.map((pos) => {
          const isSel = selected.includes(pos);
          return (
            <button
              key={pos}
              onClick={() => onToggle(pos)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '15px 20px',
                background: isSel ? 'var(--sage-light)' : 'none',
                border: 'none',
                borderBottom: '1px solid var(--border-light)',
                fontSize: 15,
                color: isSel ? 'var(--sage)' : 'var(--text-primary)',
                fontWeight: isSel ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left' as const,
              }}
            >
              <span>{pos}</span>
              {isSel && <Check size={16} color="var(--sage)" weight="bold" />}
            </button>
          );
        })}
        <div style={{ padding: '16px 20px 0' }}>
          <button
            onClick={onDone}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 12,
              background: 'var(--sage)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
