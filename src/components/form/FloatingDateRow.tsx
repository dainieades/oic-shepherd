'use client';

import React from 'react';
import { format, getDaysInMonth, getDay } from 'date-fns';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { fmtDate } from '@/lib/utils';
import { SHEET_MAX_WIDTH, Z_FLOAT } from '@/lib/constants';
import { rowBtnStyle, spacerStyle, labelStyle } from './formStyles';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function FloatingCalendar({
  anchorRect,
  date: initialDate,
  onSelect,
  onClose,
}: {
  anchorRect: DOMRect;
  date: string;
  onSelect: (d: string) => void;
  onClose: () => void;
}) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const initDate = initialDate || todayStr;
  const [selectedDate, setSelectedDate] = React.useState(initDate);
  const [viewYear, setViewYear] = React.useState(() => parseInt(initDate.slice(0, 4)));
  const [viewMonth, setViewMonth] = React.useState(() => parseInt(initDate.slice(5, 7)) - 1);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const CALENDAR_HEIGHT = 415;
  const screenW = document.documentElement.clientWidth;
  const screenH = document.documentElement.clientHeight;

  const calWidth = Math.min(anchorRect.width, SHEET_MAX_WIDTH);
  let left = anchorRect.left;
  if (left + calWidth > screenW - 8) left = screenW - calWidth - 8;
  if (left < 8) left = 8;

  let top = anchorRect.bottom + 4;
  if (top + CALENDAR_HEIGHT > screenH - 16) top = anchorRect.top - CALENDAR_HEIGHT - 4;
  if (top < 8) top = 8;

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
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function fmtDisplay(d: string) {
    const [y, mo, day] = d.split('-').map(Number);
    return format(new Date(y, mo - 1, day), 'MMM d, yyyy');
  }

  function handleDateInputBlur(e: React.FocusEvent<HTMLInputElement>) {
    const parsed = new Date(e.target.value);
    if (!isNaN(parsed.getTime())) {
      const ds = format(parsed, 'yyyy-MM-dd');
      const clamped = ds > todayStr ? todayStr : ds;
      setSelectedDate(clamped);
      setViewYear(parseInt(clamped.slice(0, 4)));
      setViewMonth(parseInt(clamped.slice(5, 7)) - 1);
    } else {
      e.target.value = selectedDate ? fmtDisplay(selectedDate) : '';
    }
  }

  const navBtnStyle: React.CSSProperties = {
    width: 30, height: 30, borderRadius: 'var(--radius-xs)',
    background: 'var(--bg)', border: '1px solid var(--border-light)',
    color: 'var(--text-secondary)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };

  return (
    <>
      <div role="presentation" style={{ position: 'fixed', inset: 0, zIndex: Z_FLOAT }} onClick={onClose} />
      <div
        style={{
          position: 'fixed', top, left, width: calWidth, zIndex: Z_FLOAT + 1,
          background: 'var(--surface)', borderRadius: 16,
          boxShadow: 'var(--shadow-elevated)',
          border: '1px solid var(--border)', overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem 0.625rem', borderBottom: '1px solid var(--border-light)' }}>
          <button onClick={onClose} style={{ fontSize: 14, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Cancel
          </button>
          <button
            onClick={() => onSelect(selectedDate)}
            style={{ height: 28, padding: '0 0.75rem', borderRadius: 'var(--radius-xs)', background: 'var(--sage)', color: 'var(--on-sage)', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            Done
          </button>
        </div>

        <div style={{ padding: '0.625rem 0.75rem 0.375rem' }}>
          <input
            key={selectedDate}
            type="text"
            defaultValue={selectedDate ? fmtDisplay(selectedDate) : ''}
            onBlur={handleDateInputBlur}
            placeholder="Apr 17, 2026"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '0.5625rem 0.75rem', borderRadius: 'var(--radius-sm)',
              border: '0.125rem solid var(--sage)',
              background: 'var(--bg)', outline: 'none',
              fontSize: 15, fontWeight: 500, color: 'var(--text-primary)',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0.875rem' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={navBtnStyle} aria-label="Previous month" onClick={prevMonth}>
              <CaretLeft size={12} weight="bold" />
            </button>
            <button style={navBtnStyle} aria-label="Next month" onClick={nextMonth}>
              <CaretRight size={12} weight="bold" />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 0.5rem' }}>
          {DAY_HEADERS.map(h => (
            <div key={h} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '0.125rem 0' }}>
              {h}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 0.5rem 0.625rem', gap: '0.0625rem 0' }}>
          {cells.map((cell, i) => {
            const isSelected = cell.dateStr === selectedDate;
            const isToday = cell.dateStr === todayStr;
            const isFuture = cell.dateStr !== null && cell.dateStr > todayStr;
            const isClickable = cell.dateStr !== null && !isFuture;
            return (
              <button
                key={i}
                disabled={!isClickable}
                onClick={() => {
                  if (!cell.dateStr) return;
                  setSelectedDate(cell.dateStr);
                  if (!cell.inMonth) {
                    setViewYear(parseInt(cell.dateStr.slice(0, 4)));
                    setViewMonth(parseInt(cell.dateStr.slice(5, 7)) - 1);
                  }
                }}
                style={{
                  width: 36, height: 36, margin: '0 auto', borderRadius: '50%',
                  border: isToday && !isSelected ? '0.125rem solid var(--sage)' : '0.125rem solid transparent',
                  background: isSelected ? 'var(--sage)' : 'none',
                  color: isSelected ? 'var(--on-sage)' : isFuture ? 'var(--text-muted)' : !cell.inMonth ? 'var(--text-muted)' : isToday ? 'var(--sage)' : 'var(--text-primary)',
                  fontSize: 13, fontWeight: isSelected || isToday ? 600 : 400,
                  cursor: isClickable ? 'pointer' : 'default',
                  opacity: isClickable ? 1 : 0.35,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function FloatingDateRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);

  function handleClick() {
    if (btnRef.current) {
      setAnchorRect(btnRef.current.getBoundingClientRect());
      setOpen(true);
    }
  }

  return (
    <>
      <button ref={btnRef} className="field-row-hover" onClick={handleClick} style={rowBtnStyle}>
        <span style={spacerStyle} />
        {icon}
        <span style={labelStyle}>{label}</span>
        <span style={{ flex: 1, fontSize: 14, color: value ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'left' }}>
          {value ? fmtDate(value) : 'Not set'}
        </span>
        <CaretRight size={14} color="var(--text-muted)" />
      </button>
      {open && anchorRect && (
        <FloatingCalendar
          anchorRect={anchorRect}
          date={value}
          onSelect={(d) => { onChange(d); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
