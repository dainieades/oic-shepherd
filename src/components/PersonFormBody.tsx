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
  type AppRole,
} from '@/lib/types';
import PickerMenu from './PickerMenu';
import PhotoAvatar from './PhotoAvatar';
import AppRolePickerSheet from './AppRolePickerSheet';
import LanguagePickerSheet from './LanguagePickerSheet';
import InviteSheet from './InviteSheet';
import { GroupPickerSheet, SheepPickerSheet, ShepherdPickerSheet, PositionPickerSheet, FamilyPickerSheet } from './PersonPickerSheets';
import {
  User,
  TextT,
  Globe,
  UsersThree,
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
} from '@phosphor-icons/react';
import {
  BACKDROP_COLOR,
  SHEET_BORDER_RADIUS,
} from '@/lib/constants';
import { TextInputRow, TextareaRow, PickerRow, DateRow, FloatingDateRow } from '@/components/form';
import { rowBtnStyle, spacerStyle, labelStyle } from '@/components/form/formStyles';

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
  person?: Person;
  onSaved: () => void;
  showPhotoUpload?: boolean;
  showInviteRow?: boolean;
  onValidityChange?: (valid: boolean) => void;
}

const PersonFormBody = React.forwardRef<PersonFormBodyHandle, Props>(
  function PersonFormBody({ person, onSaved, showPhotoUpload, showInviteRow, onValidityChange }, ref) {
    const { data, currentPersona, addPerson, updatePerson, updateFamilyMembers, assignShepherds, assignGroupsToPerson } = useApp();

    const _nameParts = (person?.englishName ?? '').trim().split(/\s+/);
    const [firstName, setFirstName] = React.useState(_nameParts[0] ?? '');
    const [lastName, setLastName] = React.useState(_nameParts.slice(1).join(' '));
    const [chineseName, setChineseName] = React.useState(person?.chineseName ?? '');
    const [photo, setPhoto] = React.useState(person?.photo ?? '');

    const [language, setLanguage] = React.useState<string[]>(person?.language ?? []);
    const [gender, setGender] = React.useState<Gender | ''>(person?.gender ?? '');
    const [birthday, setBirthday] = React.useState(person?.birthday ?? '');
    const [maritalStatus, setMaritalStatus] = React.useState<MaritalStatus | ''>(
      person?.maritalStatus ?? ''
    );
    const [anniversary, setAnniversary] = React.useState(person?.anniversary ?? '');

    const [groupIds, setGroupIds] = React.useState<string[]>(person?.groupIds ?? []);
    const [shepherdIds, setShepherdIds] = React.useState<string[]>(person?.assignedShepherdIds ?? []);
    const [status, setStatus] = React.useState<MembershipStatus>(person?.membershipStatus ?? 'non-member');
    const [attendance, setAttendance] = React.useState<ChurchAttendance>(person?.churchAttendance ?? 'first-time-visitor');
    const [membershipDate, setMembershipDate] = React.useState(person?.membershipDate ?? '');
    const [baptismDate, setBaptismDate] = React.useState(person?.baptismDate ?? '');
    const [isShepherd, setIsShepherd] = React.useState(person?.isShepherd ?? false);
    const [isBeingDiscipled, setIsBeingDiscipled] = React.useState(person?.isBeingDiscipled ?? false);
    const [appRole, setAppRole] = React.useState<AppRole>(person?.appRole ?? 'no-access');
    const [churchPositions, setChurchPositions] = React.useState<string[]>(
      person?.churchPositions ?? []
    );

    const [phone, setPhone] = React.useState(person?.phone ? formatPhone(person.phone) : '');
    const [homePhone, setHomePhone] = React.useState(
      person?.homePhone ? formatPhone(person.homePhone) : ''
    );
    const [email, setEmail] = React.useState(person?.email ?? '');
    const [homeAddress, setHomeAddress] = React.useState(person?.homeAddress ?? '');

    const firstNameRef = React.useRef<HTMLInputElement>(null);
    const lastNameRef = React.useRef<HTMLInputElement>(null);
    const chineseRef = React.useRef<HTMLInputElement>(null);
    const phoneRef = React.useRef<HTMLInputElement>(null);
    const homePhoneRef = React.useRef<HTMLInputElement>(null);
    const emailRef = React.useRef<HTMLInputElement>(null);
    const addressRef = React.useRef<HTMLTextAreaElement>(null);
    const membershipDateRef = React.useRef<HTMLInputElement>(null);

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
    const [showFamilyPicker, setShowFamilyPicker] = React.useState(false);
    const [familyId, setFamilyId] = React.useState<string | undefined>(person?.familyId);

    const initShepherdPersona = person?.isShepherd
      ? data.personas.find((p) => p.personId === person!.id)
      : null;
    const shepherdId = initShepherdPersona?.id ?? (isShepherd && person ? person.id : null);
    const [sheepIds, setSheepIds] = React.useState<string[]>(() =>
      shepherdId ? data.people.filter((p) => p.assignedShepherdIds.includes(shepherdId)).map((p) => p.id) : []
    );

    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    const selectedGroups = data.groups.filter((g) => groupIds.includes(g.id));

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


    React.useImperativeHandle(ref, () => ({
      save: async () => {
        if (!firstName.trim()) return;

        if (!person) {
          const newId = await addPerson({
            englishName: fullName,
            chineseName: chineseName.trim() || undefined,
            language: language.length > 0 ? language : ['English'],
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
          if (familyId) {
            const fam = data.families.find((f) => f.id === familyId);
            if (fam) await updateFamilyMembers(familyId, [...fam.memberIds, newId]);
          }
          await assignGroupsToPerson(newId, groupIds);
          await assignShepherds(newId, shepherdIds);
          if (isShepherd && sheepIds.length > 0) {
            for (const sheepId of sheepIds) {
              const sheep = data.people.find((p) => p.id === sheepId);
              if (sheep) await assignShepherds(sheepId, [...sheep.assignedShepherdIds, newId]);
            }
          }
          onSaved();
          return;
        }

        const originalFamilyId = person.familyId;
        if (familyId !== originalFamilyId) {
          const oldFamily = originalFamilyId ? data.families.find((f) => f.id === originalFamilyId) : undefined;
          const newFamily = familyId ? data.families.find((f) => f.id === familyId) : undefined;
          await Promise.all([
            oldFamily ? updateFamilyMembers(originalFamilyId!, oldFamily.memberIds.filter((id) => id !== person.id)) : Promise.resolve(),
            newFamily && !newFamily.memberIds.includes(person.id) ? updateFamilyMembers(familyId!, [...newFamily.memberIds, person.id]) : Promise.resolve(),
          ]);
        }

        const sheepAssignments: Promise<void>[] = [];
        if (shepherdId) {
          const originalSheepIds = data.people
            .filter((p) => p.assignedShepherdIds.includes(shepherdId))
            .map((p) => p.id);
          const added = sheepIds.filter((id) => !originalSheepIds.includes(id));
          const removed = originalSheepIds.filter((id) => !sheepIds.includes(id));
          for (const id of added) {
            const p = data.people.find((p) => p.id === id);
            if (p) sheepAssignments.push(assignShepherds(id, [...p.assignedShepherdIds, shepherdId]));
          }
          for (const id of removed) {
            const p = data.people.find((p) => p.id === id);
            if (p) sheepAssignments.push(assignShepherds(id, p.assignedShepherdIds.filter((sid) => sid !== shepherdId)));
          }
        }

        await Promise.all([
          assignGroupsToPerson(person.id, groupIds),
          assignShepherds(person.id, shepherdIds),
          ...sheepAssignments,
          updatePerson(person.id, {
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
          }),
        ]);
        onSaved();
      },
    }));

    return (
      <>
        {showPhotoUpload && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '1.5rem 0 1.25rem' }}
          >
            <PhotoAvatar
              photo={photo || undefined}
              name={fullName || 'Your Name'}
              onPhotoChange={(url) => setPhoto(url)}
              onPhotoRemove={() => setPhoto('')}
            />
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
            <PickerRow
              icon={<UsersThree size={16} color="var(--text-muted)" />}
              label="Family"
              value={familyId ? (data.families.find((f) => f.id === familyId)?.label ?? 'Unknown') : 'None'}
              onClick={() => setShowFamilyPicker(true)}
            />
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
            <FloatingDateRow
              icon={<Cake size={16} color="var(--text-muted)" />}
              label="Birthday"
              value={birthday}
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
              <FloatingDateRow
                icon={<Sparkle size={16} color="var(--text-muted)" />}
                label="Anniversary"
                value={anniversary}
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
            {isShepherd && (shepherdId || !person) && (
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
                    <>
                      {data.people
                        .filter((p) => sheepIds.includes(p.id))
                        .slice(0, 5)
                        .map((p) => (
                          <span key={p.id} style={sageChipStyle}>
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
              <span style={{ flex: 1, fontSize: 14, color: churchPositions.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'right' }}>
                {churchPositions.length > 0 ? churchPositions.join(', ') : 'None'}
              </span>
              <CaretRight size={14} color="var(--text-muted)" />
            </button>
            <FloatingDateRow
              icon={<Drop size={16} color="var(--text-muted)" />}
              label="Baptism Date"
              value={baptismDate}
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
            personName={(person?.englishName ?? fullName).split(' ')[0]}
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
        {showSheepPicker && (shepherdId || !person) && (
          <SheepPickerSheet
            people={data.people.filter((p) => !person || p.id !== person.id)}
            currentIds={sheepIds}
            onConfirm={(ids) => {
              setSheepIds(ids);
              setShowSheepPicker(false);
            }}
            onBack={() => setShowSheepPicker(false)}
          />
        )}
        {showInviteRow && showInvite && person && (
          <InviteSheet
            onClose={() => setShowInvite(false)}
            initialEmail={person.email ?? ''}
            initialRole="shepherd"
            personName={person.englishName}
            personId={person.id}
          />
        )}
        {showFamilyPicker && (
          <FamilyPickerSheet
            families={data.families}
            people={data.people}
            currentFamilyId={familyId}
            onConfirm={(id) => {
              setFamilyId(id);
              setShowFamilyPicker(false);
            }}
            onBack={() => setShowFamilyPicker(false)}
          />
        )}
      </>
    );
  }
);

export default PersonFormBody;

// ── Styles ────────────────────────────────────────────────────────────────────

const langChipStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  padding: '0.125rem 0.5rem',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--blue-light)',
  color: 'var(--blue)',
  flexShrink: 0,
};

const blueChipStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  padding: '0.125rem 0.5rem',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--blue-light)',
  color: 'var(--blue)',
  flexShrink: 0,
};

const sageChipStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  padding: '0.125rem 0.5rem',
  borderRadius: 'var(--radius-pill)',
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
          padding: '0 1.25rem',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div
      style={{
        width: 42,
        height: 24,
        borderRadius: 'var(--radius-md)',
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
          background: 'var(--surface)',
          transition: 'left 0.2s',
        }}
      />
    </div>
  );
}
