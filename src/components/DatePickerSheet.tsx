'use client';

import { format, getDaysInMonth, getDay, parseISO, isValid } from 'date-fns';
import React from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Z_SHEET } from '@/lib/constants';
import { BottomSheet } from '@/components/BottomSheet';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

type ActiveField = 'start' | 'end';

function parseTimeInput(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  // HH:MM or H:MM
  const hhmm = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if (hhmm) {
    let h = parseInt(hhmm[1]);
    const m = parseInt(hhmm[2]);
    if (m > 59) return null;
    const meridiem = hhmm[3];
    if (meridiem === 'pm' && h < 12) h += 12;
    else if (meridiem === 'am' && h === 12) h = 0;
    if (h > 23) return null;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  // Plain number like "9" or "14"
  const plain = s.match(/^(\d{1,2})\s*(am|pm)?$/);
  if (plain) {
    let h = parseInt(plain[1]);
    const meridiem = plain[2];
    if (meridiem === 'pm' && h < 12) h += 12;
    else if (meridiem === 'am' && h === 12) h = 0;
    if (h > 23) return null;
    return `${String(h).padStart(2, '0')}:00`;
  }
  return null;
}

function TimeButton({
  timeVal,
  fmtTime,
  onFocus,
  onChange,
}: {
  timeVal: string;
  fmtTime: (t: string) => string;
  onFocus: () => void;
  onChange: (val: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');

  function handleFocus() {
    setDraft(fmtTime(timeVal));
    setEditing(true);
    onFocus();
  }

  function handleBlur() {
    setEditing(false);
    const parsed = parseTimeInput(draft);
    if (parsed) onChange(parsed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.currentTarget.blur();
    if (e.key === 'Escape') {
      setEditing(false);
      setDraft('');
    }
  }

  return (
    <input
      type="text"
      value={editing ? draft : fmtTime(timeVal)}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={{
        flex: 1,
        padding: '0.625rem 0.875rem',
        background: 'none',
        border: 'none',
        outline: 'none',
        fontSize: 15,
        color: 'var(--text-secondary)',
        whiteSpace: 'nowrap',
        textAlign: 'right',
        cursor: 'text',
        minWidth: 0,
      }}
    />
  );
}

export interface DatePickerSheetProps {
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
  includeTime: boolean;
  endDate?: string;
  endTime?: string;
  includeEndDate?: boolean;
  /** When true, past dates are disabled and future dates are selectable */
  allowFuture?: boolean;
  onConfirm: (
    date: string,
    time: string,
    includeTime: boolean,
    endDate?: string,
    endTime?: string
  ) => void;
  onClose: () => void;
}

export default function DatePickerSheet({
  date,
  time,
  includeTime,
  endDate: endDateProp,
  endTime: endTimeProp,
  includeEndDate: includeEndDateProp,
  allowFuture = false,
  onConfirm,
  onClose,
}: DatePickerSheetProps) {
  const [startDate, setStartDate] = React.useState(date);
  const [startTime, setStartTime] = React.useState(time || '09:00');
  const [endDate, setEndDate] = React.useState(endDateProp || date);
  const [endTime, setEndTime] = React.useState(endTimeProp || time || '09:00');
  const [showTime, setShowTime] = React.useState(includeTime);
  const [showEndDate, setShowEndDate] = React.useState(includeEndDateProp ?? false);
  const [active, setActive] = React.useState<ActiveField>('start');

  const [viewYear, setViewYear] = React.useState(() => parseInt(date.slice(0, 4)));
  const [viewMonth, setViewMonth] = React.useState(() => parseInt(date.slice(5, 7)) - 1);

  function navigateTo(ds: string) {
    if (!ds || ds.length < 10) return;
    setViewYear(parseInt(ds.slice(0, 4)));
    setViewMonth(parseInt(ds.slice(5, 7)) - 1);
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Build calendar cells
  const daysInMonth = getDaysInMonth(new Date(viewYear, viewMonth));
  const startDow = getDay(new Date(viewYear, viewMonth, 1));
  const prevMonthDays = getDaysInMonth(new Date(viewYear, viewMonth - 1));

  type Cell = { day: number; dateStr: string | null; inMonth: boolean };
  const cells: Cell[] = [];
  const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
  const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const ds = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, dateStr: ds, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, dateStr: ds, inMonth: true });
  }
  const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
  for (let d = 1; d <= remaining; d++) {
    const ds = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, dateStr: ds, inMonth: false });
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  function handleDayClick(ds: string, inMonth: boolean) {
    if (allowFuture ? ds < todayStr : ds > todayStr) return;
    if (active === 'start') setStartDate(ds);
    else setEndDate(ds);
    if (!inMonth) navigateTo(ds);
  }

  function fmtDate(d: string) {
    const [y, mo, day] = d.split('-').map(Number);
    return format(new Date(y, mo - 1, day), 'MMM d, yyyy');
  }

  function fmtTime(t: string) {
    const [hStr, mStr] = t.split(':');
    const h = parseInt(hStr);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${mStr} ${ampm}`;
  }

  // Range highlighting: dates strictly between start and end
  const rangeStart = startDate <= endDate ? startDate : endDate;
  const rangeEnd = startDate <= endDate ? endDate : startDate;

  const navBtnStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 'var(--radius-xs)',
    background: 'var(--bg)',
    border: '1px solid var(--border-light)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
      <button
        onClick={onToggle}
        style={{
          width: 44,
          height: 26,
          borderRadius: 13,
          background: on ? 'var(--sage)' : 'var(--switch-off)',
          position: 'relative',
          cursor: 'pointer',
          border: 'none',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 3,
            left: on ? 21 : 3,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-card)',
            transition: 'left 0.2s',
          }}
        />
      </button>
    );
  }

  function DatePill({
    field,
    dateVal,
    timeVal,
  }: {
    field: ActiveField;
    dateVal: string;
    timeVal: string;
  }) {
    const isActive = active === field;

    function handleDateChange(val: string) {
      const clamped = allowFuture
        ? (val < todayStr ? todayStr : val)
        : (val > todayStr ? todayStr : val);
      setActive(field);
      if (field === 'start') {
        setStartDate(clamped);
        navigateTo(clamped);
      } else {
        setEndDate(clamped);
        navigateTo(clamped);
      }
    }

    return (
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'stretch',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          border: `0.125rem solid ${isActive ? 'var(--sage)' : 'var(--border-light)'}`,
          background: 'var(--bg)',
          transition: 'border-color 0.15s',
          position: 'relative',
        }}
      >
        {/* Date text input — left half */}
        <input
          key={dateVal}
          type="text"
          defaultValue={fmtDate(dateVal)}
          onFocus={() => setActive(field)}
          onBlur={(e) => {
            const parsed = new Date(e.target.value);
            if (isValid(parsed)) {
              const ds = format(parsed, 'yyyy-MM-dd');
              handleDateChange(ds > todayStr ? todayStr : ds);
            } else {
              e.target.value = fmtDate(dateVal);
            }
          }}
          placeholder="Apr 17, 2026"
          style={{
            flex: 1,
            padding: '0.625rem 0.875rem',
            background: 'none',
            border: 'none',
            outline: 'none',
            fontSize: 15,
            fontWeight: 500,
            color: 'var(--text-primary)',
            cursor: 'text',
            minWidth: 0,
          }}
        />

        {/* Time trigger — right half (only when time enabled) */}
        {showTime && (
          <>
            <div
              style={{
                width: 1,
                background: 'var(--border-light)',
                margin: '0.5rem 0',
                flexShrink: 0,
              }}
            />
            <TimeButton
              timeVal={timeVal}
              fmtTime={fmtTime}
              onFocus={() => setActive(field)}
              onChange={(val) => {
                setActive(field);
                field === 'start' ? setStartTime(val) : setEndTime(val);
              }}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <BottomSheet onClose={onClose} zIndex={Z_SHEET}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.875rem 1.25rem 0.75rem',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <button
              onClick={onClose}
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              {showEndDate ? `${fmtDate(startDate)} → ${fmtDate(endDate)}` : fmtDate(startDate)}
            </span>
            <button
              onClick={() =>
                onConfirm(
                  startDate,
                  startTime,
                  showTime,
                  showEndDate ? endDate : undefined,
                  showEndDate && showTime ? endTime : undefined
                )
              }
              style={{
                height: 32,
                padding: '0 0.875rem',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--sage)',
                color: 'var(--on-sage)',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
            {/* Date pill inputs */}
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0.625rem 1rem 0.125rem' }}
            >
              <DatePill field="start" dateVal={startDate} timeVal={startTime} />
              {showEndDate && <DatePill field="end" dateVal={endDate} timeVal={endTime} />}
            </div>

            {/* Month navigation */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 1rem 0.25rem',
              }}
            >
              <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={navBtnStyle} onClick={prevMonth}>
                  <CaretLeft size={14} weight="bold" />
                </button>
                <button style={navBtnStyle} onClick={nextMonth}>
                  <CaretRight size={14} weight="bold" />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                padding: '0 0.625rem',
                marginBottom: 0,
              }}
            >
              {DAY_HEADERS.map((h) => (
                <div
                  key={h}
                  style={{
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    padding: '0.125rem 0',
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                padding: '0 0.625rem',
                gap: '0.0625rem 0',
              }}
            >
              {cells.map((cell, i) => {
                const isStart = cell.dateStr === startDate;
                const isEnd = showEndDate && cell.dateStr === endDate;
                const inRange =
                  showEndDate &&
                  cell.dateStr !== null &&
                  cell.dateStr > rangeStart &&
                  cell.dateStr < rangeEnd;
                const isToday = cell.dateStr === todayStr;
                const isDisabledDate = cell.dateStr !== null && (
                  allowFuture ? cell.dateStr < todayStr : cell.dateStr > todayStr
                );
                const isSelected = isStart || isEnd;

                const isClickable = cell.dateStr !== null && !isDisabledDate;
                return (
                  <button
                    key={i}
                    disabled={!isClickable}
                    onClick={() => cell.dateStr && handleDayClick(cell.dateStr, cell.inMonth)}
                    style={{
                      width: 44,
                      height: 44,
                      margin: '0 auto',
                      borderRadius: '50%',
                      border:
                        isToday && !isSelected ? '0.125rem solid var(--sage)' : '0.125rem solid transparent',
                      background: isSelected
                        ? 'var(--sage)'
                        : inRange
                          ? 'color-mix(in srgb, var(--sage) 15%, transparent)'
                          : 'none',
                      color: isSelected
                        ? 'var(--on-sage)'
                        : isDisabledDate
                          ? 'var(--text-muted)'
                          : !cell.inMonth
                            ? 'var(--text-muted)'
                            : isToday
                              ? 'var(--sage)'
                              : 'var(--text-primary)',
                      fontSize: 15,
                      fontWeight: isSelected || isToday ? 600 : 400,
                      cursor: isClickable ? 'pointer' : 'default',
                      opacity: isClickable ? 1 : 0.35,
                    }}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ margin: '0.5rem 1rem 0', borderTop: '1px solid var(--border-light)' }} />

            {/* End date toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 1rem 0',
              }}
            >
              <span style={{ fontSize: 15, color: 'var(--text-primary)' }}>End date</span>
              <Toggle
                on={showEndDate}
                onToggle={() => {
                  setShowEndDate((v) => !v);
                  setActive('start');
                }}
              />
            </div>

            {/* Include time toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 1rem 0',
              }}
            >
              <span style={{ fontSize: 15, color: 'var(--text-primary)' }}>Include time</span>
              <Toggle on={showTime} onToggle={() => setShowTime((v) => !v)} />
            </div>
          </div>
          {/* end scrollable body */}
    </BottomSheet>
  );
}
