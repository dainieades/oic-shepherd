'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { formatPhone, fmtDate, fullName } from '@/lib/utils';
import {
  type Person,
  type MembershipStatus,
  type ChurchAttendance,
  type Gender,
  type MaritalStatus,
  type AppRole,
  type VisitorSubmission,
  type ReferralSource,
  type Interest,
  REFERRAL_SOURCES,
  INTERESTS,
} from '@/lib/types';
import { fetchLatestVisitorSubmission } from '@/lib/mappers';
import { REFERRAL_LABELS, INTEREST_LABELS } from '@/lib/constants';
import PickerMenu from './PickerMenu';
import PhotoAvatar from './PhotoAvatar';
import AppRolePickerSheet from './AppRolePickerSheet';
import LanguagePickerSheet from './LanguagePickerSheet';
import InviteSheet from './InviteSheet';
import {
  GroupPickerSheet,
  SheepPickerSheet,
  ShepherdPickerSheet,
  PositionPickerSheet,
  FamilyPickerSheet,
} from './PersonPickerSheets';
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
  Megaphone,
  HandsPraying,
  HandHeart,
  UsersFour,
  PaperPlaneTilt,
  ArrowsOutSimple,
} from '@phosphor-icons/react';
import { BACKDROP_COLOR, SHEET_BORDER_RADIUS } from '@/lib/constants';
import { TextInputRow, TextareaRow, PickerRow, DateRow, FloatingDateRow } from '@/components/form';
import { rowBtnStyle, spacerStyle, labelStyle } from '@/components/form/formStyles';
import { MaybeSheet, type SheetVariant } from './BottomSheet';

const MEMBERSHIP_OPTIONS: { value: MembershipStatus; label: string }[] = [
  { value: 'member', label: 'Member' },
  { value: 'non-member', label: 'Non-Member' },
  { value: 'membership-track', label: 'Membership Track' },
];

const CHURCH_ATTENDANCE_OPTIONS: { value: ChurchAttendance; label: string }[] = [
  { value: 'visitor', label: 'Visitor' },
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
  onSaved: (newPersonId?: string) => void;
  showPhotoUpload?: boolean;
  showInviteRow?: boolean;
  onValidityChange?: (valid: boolean) => void;
  ownContact?: boolean;
  /** When set, each picker sheet renders as a standalone BottomSheet with this variant */
  sheetVariant?: SheetVariant;
}

const PersonFormBody = React.forwardRef<PersonFormBodyHandle, Props>(function PersonFormBody(
  { person, onSaved, showPhotoUpload, showInviteRow, onValidityChange, ownContact, sheetVariant },
  ref
) {
  const {
    data,
    currentPersona,
    personaByPersonId,
    addPerson,
    updatePerson,
    updateFamilyMembers,
    assignShepherds,
    assignGroupsToPerson,
    updateVisitorSubmission,
  } = useApp();

  const [firstName, setFirstName] = React.useState(person?.preferredName ?? '');
  const [lastName, setLastName] = React.useState(person?.lastName ?? '');
  const [chineseName, setChineseName] = React.useState(person?.alternativeName ?? '');
  const [photo, setPhoto] = React.useState(person?.photo ?? '');

  const [language, setLanguage] = React.useState<string[]>(person?.language ?? ['English']);
  const [gender, setGender] = React.useState<Gender | ''>(person?.gender ?? 'male');
  const [birthday, setBirthday] = React.useState(person?.birthday ?? '');
  const [maritalStatus, setMaritalStatus] = React.useState<MaritalStatus | ''>(
    person?.maritalStatus ?? ''
  );
  const [anniversary, setAnniversary] = React.useState(person?.anniversary ?? '');

  const [groupIds, setGroupIds] = React.useState<string[]>(person?.groupIds ?? []);
  const [shepherdIds, setShepherdIds] = React.useState<string[]>(person?.assignedShepherdIds ?? []);
  const [status, setStatus] = React.useState<MembershipStatus>(
    person?.membershipStatus ?? 'non-member'
  );
  const [attendance, setAttendance] = React.useState<ChurchAttendance>(
    person?.churchAttendance ?? 'visitor'
  );
  const [membershipDate, setMembershipDate] = React.useState(person?.membershipDate ?? '');
  const [baptized, setBaptized] = React.useState<boolean>(
    person ? (person.baptized ?? false) : status === 'member'
  );
  const [baptismDate, setBaptismDate] = React.useState(person?.baptismDate ?? '');
  const [isShepherd, setIsShepherd] = React.useState(person?.isShepherd ?? false);
  const [isBeingDiscipled, setIsBeingDiscipled] = React.useState(person?.isBeingDiscipled ?? false);
  const [isStudent, setIsStudent] = React.useState(person?.isStudent ?? false);
  const [appRole, setAppRole] = React.useState<AppRole>(person?.appRole ?? 'no-access');
  const [canTriageVisitors, setCanTriageVisitors] = React.useState<boolean>(
    person?.canTriageVisitors ?? false
  );
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

  const statusBtnRef = React.useRef<HTMLButtonElement>(null);
  const attendanceBtnRef = React.useRef<HTMLButtonElement>(null);
  const genderBtnRef = React.useRef<HTMLButtonElement>(null);
  const maritalBtnRef = React.useRef<HTMLButtonElement>(null);

  const [openPicker, setOpenPicker] = React.useState<
    'status' | 'attendance' | 'gender' | 'marital' | 'appRole' | 'referralSource' | null
  >(null);
  const referralBtnRef = React.useRef<HTMLButtonElement>(null);

  const [visitorSubmission, setVisitorSubmission] = React.useState<VisitorSubmission | null>(null);
  const [referralSource, setReferralSource] = React.useState<ReferralSource | ''>('');
  const [referralDetail, setReferralDetail] = React.useState('');
  const [interests, setInterests] = React.useState<Interest[]>([]);
  const [prayerRequest, setPrayerRequest] = React.useState('');
  const referralDetailRef = React.useRef<HTMLInputElement>(null);
  const prayerRequestRef = React.useRef<HTMLTextAreaElement>(null);

  const canEditVisitorCard = currentPersona.role === 'admin';

  const personId = person?.id;
  React.useEffect(() => {
    if (!personId || !canEditVisitorCard) return;
    let cancelled = false;
    (async () => {
      const sub = await fetchLatestVisitorSubmission(personId);
      if (cancelled || !sub) return;
      setVisitorSubmission(sub);
      setReferralSource(sub.referralSource ?? '');
      setReferralDetail(sub.referralDetail ?? '');
      setInterests(sub.interests);
      setPrayerRequest(sub.prayerRequest ?? '');
    })();
    return () => {
      cancelled = true;
    };
  }, [personId, canEditVisitorCard]);
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
    shepherdId
      ? data.people.filter((p) => p.assignedShepherdIds.includes(shepherdId)).map((p) => p.id)
      : []
  );
  const initialSheepIdsRef = React.useRef<string[]>(
    shepherdId
      ? data.people.filter((p) => p.assignedShepherdIds.includes(shepherdId)).map((p) => p.id)
      : []
  );

  const fullDisplayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
  const selectedGroups = data.groups.filter((g) => groupIds.includes(g.id));
  const personaSignedIn =
    !!person &&
    (personaByPersonId.has(person.id) ||
      (!!email &&
        data.personas.some(
          (p) => !!p.userId && p.email?.toLowerCase() === email.trim().toLowerCase()
        )));
  const isPendingInvite = !!person && appRole !== 'no-access' && !!email && !personaSignedIn;

  const personaPersonIds = new Set(data.personas.map((p) => p.personId).filter(Boolean));
  type ShepherdEntry = { id: string; name: string; subtitle: string; photo?: string };
  const shepherdEntries: ShepherdEntry[] = [
    ...data.personas
      .filter((p) => p.role === 'shepherd' || p.role === 'admin')
      .map((p) => ({
        id: p.id,
        name: p.name,
        subtitle: p.role === 'admin' ? 'Pastor' : 'User',
        photo: p.personId
          ? data.people.find((person) => person.id === p.personId)?.photo
          : undefined,
      })),
    ...data.people
      .filter((p) => p.isShepherd && !personaPersonIds.has(p.id))
      .map((p) => ({ id: p.id, name: fullName(p), subtitle: 'User', photo: p.photo })),
  ];

  const statusLabel = MEMBERSHIP_OPTIONS.find((o) => o.value === status)?.label ?? '';
  const attendanceLabel =
    CHURCH_ATTENDANCE_OPTIONS.find((o) => o.value === attendance)?.label ?? attendance;
  const genderLabel = GENDER_OPTIONS.find((o) => o.value === gender)?.label ?? 'Not set';
  const maritalLabel = MARITAL_OPTIONS.find((o) => o.value === maritalStatus)?.label ?? 'Not set';
  const initials = fullDisplayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sorted = (arr: string[]) => [...arr].sort().join('\0');
  const isDirty = React.useMemo(() => {
    if (!person) return true;
    return (
      firstName !== (person.preferredName ?? '') ||
      lastName !== (person.lastName ?? '') ||
      chineseName !== (person.alternativeName ?? '') ||
      photo !== (person.photo ?? '') ||
      sorted(language) !== sorted(person.language ?? ['English']) ||
      gender !== (person.gender ?? 'male') ||
      birthday !== (person.birthday ?? '') ||
      maritalStatus !== (person.maritalStatus ?? '') ||
      anniversary !== (person.anniversary ?? '') ||
      sorted(groupIds) !== sorted(person.groupIds ?? []) ||
      sorted(shepherdIds) !== sorted(person.assignedShepherdIds ?? []) ||
      sorted(sheepIds) !== sorted(initialSheepIdsRef.current) ||
      status !== (person.membershipStatus ?? 'non-member') ||
      attendance !== (person.churchAttendance ?? 'visitor') ||
      membershipDate !== (person.membershipDate ?? '') ||
      baptized !== (person.membershipStatus === 'member' ? true : (person.baptized ?? false)) ||
      baptismDate !== (person.baptismDate ?? '') ||
      isShepherd !== (person.isShepherd ?? false) ||
      isBeingDiscipled !== (person.isBeingDiscipled ?? false) ||
      isStudent !== (person.isStudent ?? false) ||
      appRole !== (person.appRole ?? 'no-access') ||
      canTriageVisitors !== (person.canTriageVisitors ?? false) ||
      sorted(churchPositions) !== sorted(person.churchPositions ?? []) ||
      phone !== (person.phone ? formatPhone(person.phone) : '') ||
      homePhone !== (person.homePhone ? formatPhone(person.homePhone) : '') ||
      email !== (person.email ?? '') ||
      homeAddress !== (person.homeAddress ?? '') ||
      familyId !== person.familyId
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person, firstName, lastName, chineseName, photo, language, gender, birthday, maritalStatus,
      anniversary, groupIds, shepherdIds, sheepIds, status, attendance, membershipDate, baptized,
      baptismDate, isShepherd, isBeingDiscipled, isStudent, appRole, canTriageVisitors,
      churchPositions, phone, homePhone, email, homeAddress, familyId]);

  React.useEffect(() => {
    onValidityChange?.(!!firstName.trim() && isDirty);
  }, [firstName, isDirty, onValidityChange]);

  React.useEffect(() => {
    if (status === 'member') setBaptized(true);
  }, [status]);

  React.useImperativeHandle(ref, () => ({
    save: async () => {
      if (!firstName.trim()) return;

      if (!person) {
        const newId = await addPerson({
          preferredName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          alternativeName: chineseName.trim() || undefined,
          language: language.length > 0 ? language : ['English'],
          gender: gender || undefined,
          birthday: birthday || undefined,
          maritalStatus: maritalStatus || undefined,
          anniversary: maritalStatus === 'married' && anniversary ? anniversary : undefined,
          membershipStatus: status,
          churchAttendance: attendance,
          membershipDate: status === 'member' && membershipDate ? membershipDate : undefined,
          baptized: baptized || undefined,
          baptismDate: baptized && baptismDate ? baptismDate : undefined,
          isShepherd: isShepherd || undefined,
          isBeingDiscipled: isBeingDiscipled || undefined,
          isStudent: isStudent || undefined,
          appRole,
          canTriageVisitors: appRole === 'shepherd' && canTriageVisitors ? true : undefined,
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
        onSaved(newId);
        return;
      }

      const originalFamilyId = person.familyId;
      if (familyId !== originalFamilyId) {
        const oldFamily = originalFamilyId
          ? data.families.find((f) => f.id === originalFamilyId)
          : undefined;
        const newFamily = familyId ? data.families.find((f) => f.id === familyId) : undefined;
        await Promise.all([
          oldFamily
            ? updateFamilyMembers(
                originalFamilyId!,
                oldFamily.memberIds.filter((id) => id !== person.id)
              )
            : Promise.resolve(),
          newFamily && !newFamily.memberIds.includes(person.id)
            ? updateFamilyMembers(familyId!, [...newFamily.memberIds, person.id])
            : Promise.resolve(),
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
          if (p)
            sheepAssignments.push(
              assignShepherds(
                id,
                p.assignedShepherdIds.filter((sid) => sid !== shepherdId)
              )
            );
        }
      }

      const visitorPatch: Parameters<typeof updateVisitorSubmission>[1] = {};
      if (visitorSubmission) {
        if ((visitorSubmission.referralSource ?? '') !== referralSource) {
          visitorPatch.referralSource = referralSource === '' ? null : referralSource;
        }
        if ((visitorSubmission.referralDetail ?? '') !== referralDetail.trim()) {
          visitorPatch.referralDetail = referralDetail.trim() || null;
        }
        const interestsChanged =
          visitorSubmission.interests.length !== interests.length ||
          visitorSubmission.interests.some((i) => !interests.includes(i));
        if (interestsChanged) visitorPatch.interests = interests;
        if ((visitorSubmission.prayerRequest ?? '') !== prayerRequest.trim()) {
          visitorPatch.prayerRequest = prayerRequest.trim() || null;
        }
      }

      await Promise.all([
        assignGroupsToPerson(person.id, groupIds),
        assignShepherds(person.id, shepherdIds),
        ...sheepAssignments,
        visitorSubmission && Object.keys(visitorPatch).length > 0
          ? updateVisitorSubmission(visitorSubmission.id, visitorPatch)
          : Promise.resolve(),
        updatePerson(person.id, {
          preferredName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          alternativeName: chineseName.trim() || undefined,
          ...(showPhotoUpload ? { photo: photo || undefined } : {}),
          language,
          gender: gender || undefined,
          birthday: birthday || undefined,
          maritalStatus: maritalStatus || undefined,
          anniversary: maritalStatus === 'married' && anniversary ? anniversary : undefined,
          membershipStatus: status,
          churchAttendance: attendance,
          membershipDate: status === 'member' && membershipDate ? membershipDate : undefined,
          baptized,
          baptismDate: baptized && baptismDate ? baptismDate : undefined,
          isShepherd: isShepherd || undefined,
          isBeingDiscipled: isBeingDiscipled || undefined,
          isStudent,
          appRole,
          canTriageVisitors: appRole === 'shepherd' ? canTriageVisitors : false,
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
            name={fullDisplayName || 'Your Name'}
            onPhotoChange={(url) => setPhoto(url)}
            onPhotoRemove={() => setPhoto('')}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 'var(--text-20)',
                fontWeight: 'var(--font-bold)',
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: 'var(--tracking-tight-2)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {fullDisplayName || 'Your Name'}
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {!!person &&
          (currentPersona.role === 'admin' ||
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
                <span style={{ flex: 1, fontSize: 'var(--text-14)', color: 'var(--sage)', textAlign: 'right' }}>
                  Give app access…
                </span>
                <CaretRight size={14} color="var(--text-muted)" />
              </button>
            ) : (
              <>
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
                      fontSize: 'var(--text-14)',
                      color: 'var(--text-primary)',
                      textAlign: 'right',
                    }}
                  >
                    {appRole === 'shepherd' && canTriageVisitors
                      ? 'User · Reviews newcomers'
                      : {
                          admin: 'Admin',
                          shepherd: 'User',
                          'no-access': 'No Access',
                        }[appRole]}
                  </span>
                  {currentPersona.role === 'admin' && (
                    <CaretRight size={14} color="var(--text-muted)" />
                  )}
                </button>
                {isPendingInvite && (
                  <div
                    style={{
                      ...rowBtnStyle,
                      cursor: 'default',
                      background: 'var(--amber-light, #fffbeb)',
                      borderTop: '1px solid var(--border-light)',
                    }}
                  >
                    <span style={spacerStyle} />
                    <PaperPlaneTilt size={16} color="var(--amber, #d97706)" />
                    <span
                      style={{
                        fontSize: 'var(--text-12)',
                        color: 'var(--amber, #d97706)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      Invite pending
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 'var(--text-13)',
                        color: 'var(--text-muted)',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Hasn't signed in yet
                    </span>
                  </div>
                )}
              </>
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
            autoComplete={ownContact ? 'given-name' : undefined}
          />
          <TextInputRow
            icon={<User size={16} color="var(--text-muted)" style={{ opacity: 0 }} />}
            label="Last"
            inputRef={lastNameRef}
            value={lastName}
            onChange={setLastName}
            placeholder="Last name"
            autoComplete={ownContact ? 'family-name' : undefined}
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
            value={
              familyId ? (data.families.find((f) => f.id === familyId)?.label ?? 'Unknown') : 'None'
            }
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
            <span
              style={{
                flex: 1,
                fontSize: 'var(--text-14)',
                color: language.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {language.length > 0 ? language.join(', ') : 'None'}
            </span>
            <CaretRight size={14} color="var(--text-muted)" />
          </button>
          <PickerRow
            ref={genderBtnRef}
            icon={<GenderIntersex size={16} color="var(--text-muted)" />}
            label="Gender"
            value={genderLabel}
            onClick={() => setOpenPicker((v) => (v === 'gender' ? null : 'gender'))}
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
            onClick={() => setOpenPicker((v) => (v === 'marital' ? null : 'marital'))}
          />
          {maritalStatus === 'married' && (
            <FloatingDateRow
              icon={<Sparkle size={16} color="var(--text-muted)" />}
              label="Anniversary"
              value={anniversary}
              onChange={setAnniversary}
            />
          )}
          <button
            className="field-row-hover"
            onClick={() => setIsStudent((v) => !v)}
            style={rowBtnStyle}
          >
            <span style={spacerStyle} />
            <BookOpenText size={16} color="var(--text-muted)" />
            <span style={{ ...labelStyle, flex: 1 }}>Student?</span>
            <Toggle on={isStudent} />
          </button>
        </FormSection>

        <FormSection label="Church">
          <PickerRow
            ref={statusBtnRef}
            icon={<IdentificationCard size={16} color="var(--text-muted)" />}
            label="Status"
            value={statusLabel}
            onClick={() => setOpenPicker((v) => (v === 'status' ? null : 'status'))}
          />
          <PickerRow
            ref={attendanceBtnRef}
            icon={<Pulse size={16} color="var(--text-muted)" />}
            label="Attendance"
            value={attendanceLabel}
            onClick={() => setOpenPicker((v) => (v === 'attendance' ? null : 'attendance'))}
          />
          {status === 'member' && (
            <FloatingDateRow
              icon={<CalendarCheck size={16} color="var(--text-muted)" />}
              label="Member Since"
              value={membershipDate}
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
                <span style={{ fontSize: 'var(--text-14)', color: 'var(--text-muted)' }}>None</span>
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
                <span style={{ fontSize: 'var(--text-14)', color: 'var(--text-muted)' }}>None</span>
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
                          {fullName(p)}
                        </span>
                      ))}
                    {sheepIds.length > 5 && (
                      <span
                        style={{ fontSize: 'var(--text-13)', color: 'var(--text-muted)', alignSelf: 'center' }}
                      >
                        +{sheepIds.length - 5} more
                      </span>
                    )}
                  </>
                ) : (
                  <span style={{ fontSize: 'var(--text-14)', color: 'var(--text-muted)' }}>None</span>
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
            <span
              style={{
                flex: 1,
                fontSize: 'var(--text-14)',
                color: churchPositions.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                textAlign: 'right',
              }}
            >
              {churchPositions.length > 0 ? churchPositions.join(', ') : 'None'}
            </span>
            <CaretRight size={14} color="var(--text-muted)" />
          </button>
          <button
            className="field-row-hover"
            onClick={() => setBaptized((v) => !v)}
            style={rowBtnStyle}
          >
            <span style={spacerStyle} />
            <Drop size={16} color="var(--text-muted)" />
            <span style={{ ...labelStyle, flex: 1 }}>Baptized?</span>
            <Toggle on={baptized} />
          </button>
          {baptized && (
            <FloatingDateRow
              icon={<Drop size={16} color="var(--text-muted)" />}
              label="Baptism Date"
              value={baptismDate}
              onChange={setBaptismDate}
            />
          )}
        </FormSection>

        {canEditVisitorCard && visitorSubmission && (
          <FormSection label="Newcomer card">
            <PickerRow
              ref={referralBtnRef}
              icon={<Megaphone size={16} color="var(--text-muted)" />}
              label="Heard via"
              value={referralSource ? REFERRAL_LABELS[referralSource] : 'Not set'}
              onClick={() => setOpenPicker((v) => (v === 'referralSource' ? null : 'referralSource'))}
            />
            {referralSource && (
              <TextInputRow
                icon={<Megaphone size={16} color="var(--text-muted)" style={{ opacity: 0 }} />}
                label="Detail"
                inputRef={referralDetailRef}
                value={referralDetail}
                onChange={setReferralDetail}
                placeholder="More about how they heard"
              />
            )}
            <div style={rowBtnStyle as React.CSSProperties}>
              <span style={spacerStyle} />
              <Heart size={16} color="var(--text-muted)" />
              <span style={labelStyle}>Interests</span>
              <div
                style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0.5rem 0' }}
              >
                {INTERESTS.map((i) => {
                  const on = interests.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setInterests((prev) =>
                          prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
                        )
                      }
                      style={{
                        fontSize: 'var(--text-12)',
                        fontWeight: 'var(--font-semibold)',
                        padding: '0.25rem 0.625rem',
                        borderRadius: 'var(--radius-pill)',
                        background: on ? 'var(--sage-light)' : 'transparent',
                        color: on ? 'var(--sage-dark, var(--sage))' : 'var(--text-muted)',
                        border: `1px solid ${on ? 'var(--sage)' : 'var(--border)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      {INTEREST_LABELS[i]}
                    </button>
                  );
                })}
              </div>
            </div>
            <TextareaRow
              icon={<HandsPraying size={16} color="var(--text-muted)" />}
              label="Prayer"
              inputRef={prayerRequestRef}
              value={prayerRequest}
              onChange={setPrayerRequest}
              placeholder="Prayer request"
              rows={2}
              resizable
            />
          </FormSection>
        )}

        <FormSection label="Contact">
          <TextInputRow
            icon={<Phone size={16} color="var(--text-muted)" />}
            label="Phone"
            inputRef={phoneRef}
            value={phone}
            onChange={(v) => setPhone(formatPhone(v))}
            placeholder="(555) 000-0000"
            type="tel"
            autoComplete={ownContact ? 'tel' : undefined}
          />
          <TextInputRow
            icon={<PhoneCall size={16} color="var(--text-muted)" />}
            label="Home"
            inputRef={homePhoneRef}
            value={homePhone}
            onChange={(v) => setHomePhone(formatPhone(v))}
            placeholder="(555) 000-0000"
            type="tel"
            autoComplete={ownContact ? 'home tel' : undefined}
          />
          <TextInputRow
            icon={<Envelope size={16} color="var(--text-muted)" />}
            label="Email"
            inputRef={emailRef}
            value={email}
            onChange={setEmail}
            placeholder="Email address"
            type="email"
            autoComplete={ownContact ? 'email' : undefined}
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
      {openPicker === 'referralSource' && (
        <PickerMenu
          anchorRef={referralBtnRef}
          title="Heard via"
          options={[
            { value: '', label: 'Not set' },
            ...REFERRAL_SOURCES.map((s) => ({ value: s, label: REFERRAL_LABELS[s] })),
          ]}
          value={referralSource}
          onSelect={(v) => setReferralSource(v as ReferralSource | '')}
          onClose={() => setOpenPicker(null)}
        />
      )}
      {openPicker === 'appRole' && (
        <MaybeSheet sheetVariant={sheetVariant} onClose={() => setOpenPicker(null)}>
          <AppRolePickerSheet
            currentRole={appRole}
            canTriageVisitors={canTriageVisitors}
            onSelect={(role) => {
              setAppRole(role);
              if (role !== 'shepherd') setCanTriageVisitors(false);
              if (role !== 'shepherd') setOpenPicker(null);
            }}
            onToggleTriage={(next) => {
              setCanTriageVisitors(next);
            }}
            onRemove={() => {
              setAppRole('no-access');
              setCanTriageVisitors(false);
              setOpenPicker(null);
            }}
            onClose={() => setOpenPicker(null)}
            isAdmin={currentPersona.role === 'admin'}
            personName={person?.preferredName ?? firstName.trim()}
          />
        </MaybeSheet>
      )}
      {showLanguagePicker && (
        <MaybeSheet sheetVariant={sheetVariant} onClose={() => setShowLanguagePicker(false)}>
          <LanguagePickerSheet
            currentLanguages={language}
            onConfirm={(langs) => {
              setLanguage(langs);
              setShowLanguagePicker(false);
            }}
            onBack={() => setShowLanguagePicker(false)}
          />
        </MaybeSheet>
      )}
      {showPositionPicker && (
        <MaybeSheet sheetVariant={sheetVariant} onClose={() => setShowPositionPicker(false)}>
          <PositionPickerSheet
            currentPositions={churchPositions}
            onConfirm={(positions) => {
              setChurchPositions(positions);
              setShowPositionPicker(false);
            }}
            onBack={() => setShowPositionPicker(false)}
          />
        </MaybeSheet>
      )}
      {showGroupPicker && (
        <MaybeSheet sheetVariant={sheetVariant} onClose={() => setShowGroupPicker(false)}>
          <GroupPickerSheet
            groups={data.groups}
            currentIds={groupIds}
            onConfirm={(ids) => {
              setGroupIds(ids);
              setShowGroupPicker(false);
            }}
            onBack={() => setShowGroupPicker(false)}
          />
        </MaybeSheet>
      )}
      {showShepherdPicker && (
        <MaybeSheet sheetVariant={sheetVariant} onClose={() => setShowShepherdPicker(false)}>
          <ShepherdPickerSheet
            entries={shepherdEntries}
            currentIds={shepherdIds}
            onConfirm={(ids) => {
              setShepherdIds(ids);
              setShowShepherdPicker(false);
            }}
            onBack={() => setShowShepherdPicker(false)}
          />
        </MaybeSheet>
      )}
      {showSheepPicker && (shepherdId || !person) && (
        <MaybeSheet sheetVariant={sheetVariant} onClose={() => setShowSheepPicker(false)}>
          <SheepPickerSheet
            people={data.people.filter((p) => !person || p.id !== person.id)}
            currentIds={sheepIds}
            onConfirm={(ids) => {
              setSheepIds(ids);
              setShowSheepPicker(false);
            }}
            onBack={() => setShowSheepPicker(false)}
          />
        </MaybeSheet>
      )}
      {showInviteRow && showInvite && person && (
        <InviteSheet
          onClose={() => setShowInvite(false)}
          initialEmail={person.email ?? ''}
          initialRole="shepherd"
          personName={fullName(person)}
          personId={person.id}
        />
      )}
      {showFamilyPicker && (
        <MaybeSheet sheetVariant={sheetVariant} onClose={() => setShowFamilyPicker(false)}>
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
        </MaybeSheet>
      )}
    </>
  );
});

export default PersonFormBody;

// ── Styles ────────────────────────────────────────────────────────────────────

const langChipStyle: React.CSSProperties = {
  fontSize: 'var(--text-11)',
  fontWeight: 'var(--font-medium)',
  padding: '0.125rem 0.5rem',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--blue-light)',
  color: 'var(--blue)',
  flexShrink: 0,
};

const blueChipStyle: React.CSSProperties = {
  fontSize: 'var(--text-11)',
  fontWeight: 'var(--font-medium)',
  padding: '0.125rem 0.5rem',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--blue-light)',
  color: 'var(--blue)',
  flexShrink: 0,
};

const sageChipStyle: React.CSSProperties = {
  fontSize: 'var(--text-11)',
  fontWeight: 'var(--font-medium)',
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
          fontSize: 'var(--text-10)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wide-6)',
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
        background: on ? 'var(--sage)' : 'var(--switch-off)',
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
