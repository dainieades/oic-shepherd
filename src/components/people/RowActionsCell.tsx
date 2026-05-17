'use client';

import React from 'react';
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react';
import {
  DotsThreeVertical,
  NotePencil,
  ListChecks,
  Megaphone,
  PencilSimple,
  Archive,
  Trash,
} from '@phosphor-icons/react';
import { Z_DROPDOWN, archiveConfirmCopy, deletePersonConfirmCopy } from '@/lib/constants';
import { useApp } from '@/lib/context';
import AddLogModal from '@/components/AddLogModal';
import AddTodoModal from '@/components/AddTodoModal';
import AddNoticeModal from '@/components/AddNoticeModal';
import EditPersonDrawer from '@/components/EditPersonDrawer';
import EditFamilyDrawer from '@/components/EditFamilyDrawer';
import ConfirmActionSheet from '@/components/ConfirmActionSheet';
import type { Person, Family } from '@/lib/types';

type Target = { kind: 'person'; person: Person } | { kind: 'family'; family: Family };

type ActiveModal = 'log' | 'todo' | 'notice' | 'edit' | null;
type ConfirmAction = 'archive' | 'delete' | null;

const cellStyle: React.CSSProperties = {
  padding: '0.625rem 0.5rem',
  borderBottom: '1px solid var(--border-light)',
  verticalAlign: 'middle',
  width: '2.5rem',
  textAlign: 'right',
};

const triggerStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.75rem',
  height: '1.75rem',
  borderRadius: 'var(--radius-sm)',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: 0,
};

const menuItemStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '0.5rem 0.75rem',
  background: 'none',
  border: 'none',
  fontSize: 'var(--text-13)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  textAlign: 'left',
};

export default function RowActionsCell({ target }: { target: Target }) {
  const { currentPersona, updatePerson, deletePerson } = useApp();
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<ActiveModal>(null);
  const [confirmAction, setConfirmAction] = React.useState<ConfirmAction>(null);

  const canEdit =
    currentPersona.role === 'admin' || currentPersona.role === 'shepherd';
  const isPerson = target.kind === 'person';
  const isArchived =
    isPerson && target.person.churchAttendance === 'archived';
  const personFirstName = isPerson ? target.person.preferredName : '';

  const handleArchive = () => {
    if (!isPerson) return;
    updatePerson(target.person.id, {
      churchAttendance: isArchived ? 'regular' : 'archived',
    });
    setConfirmAction(null);
  };

  const handleDelete = () => {
    if (!isPerson) return;
    deletePerson(target.person.id);
    setConfirmAction(null);
  };

  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-end',
    strategy: 'fixed',
    middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const floating = refs.floating.current;
      const reference = refs.reference.current as HTMLElement | null;
      const node = e.target as Node;
      if (floating && !floating.contains(node) && reference && !reference.contains(node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, refs.floating, refs.reference]);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const choose = (modal: ActiveModal) => {
    setOpen(false);
    setActive(modal);
  };

  const personId = target.kind === 'person' ? target.person.id : undefined;
  const familyId = target.kind === 'family' ? target.family.id : undefined;
  const editLabel = target.kind === 'person' ? 'Edit person' : 'Edit family';

  return (
    <td style={cellStyle} onClick={stop}>
      <button
        ref={refs.setReference}
        type="button"
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        style={triggerStyle}
        className="row-actions-trigger"
      >
        <DotsThreeVertical size={18} weight="bold" />
      </button>

      {open && (
        <div
          ref={refs.setFloating}
          role="menu"
          style={{
            ...floatingStyles,
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-elevated)',
            border: '1px solid var(--border-light)',
            minWidth: '11rem',
            padding: '0.25rem 0',
            zIndex: Z_DROPDOWN,
          }}
          onClick={stop}
        >
          <button
            type="button"
            role="menuitem"
            style={menuItemStyle}
            className="row-actions-item"
            onClick={() => choose('log')}
          >
            <NotePencil size={15} color="var(--text-muted)" />
            Add log
          </button>
          <button
            type="button"
            role="menuitem"
            style={menuItemStyle}
            className="row-actions-item"
            onClick={() => choose('todo')}
          >
            <ListChecks size={15} color="var(--text-muted)" />
            Add to-do
          </button>
          <button
            type="button"
            role="menuitem"
            style={menuItemStyle}
            className="row-actions-item"
            onClick={() => choose('notice')}
          >
            <Megaphone size={15} color="var(--text-muted)" />
            Add notice
          </button>
          <button
            type="button"
            role="menuitem"
            style={menuItemStyle}
            className="row-actions-item"
            onClick={() => choose('edit')}
          >
            <PencilSimple size={15} color="var(--text-muted)" />
            {editLabel}
          </button>
          {isPerson && canEdit && (
            <>
              <div
                style={{
                  height: '1px',
                  background: 'var(--border-light)',
                  margin: '0.25rem 0',
                }}
              />
              <button
                type="button"
                role="menuitem"
                style={menuItemStyle}
                className="row-actions-item"
                onClick={() => {
                  setOpen(false);
                  setConfirmAction('archive');
                }}
              >
                <Archive size={15} color="var(--text-muted)" />
                {isArchived ? 'Unarchive' : 'Archive'}
              </button>
              <button
                type="button"
                role="menuitem"
                style={{ ...menuItemStyle, color: 'var(--red)' }}
                className="row-actions-item"
                onClick={() => {
                  setOpen(false);
                  setConfirmAction('delete');
                }}
              >
                <Trash size={15} color="var(--red)" />
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {active === 'log' && (
        <AddLogModal
          onClose={() => setActive(null)}
          prefillPersonId={personId}
          prefillFamilyId={familyId}
        />
      )}
      {active === 'todo' && (
        <AddTodoModal
          onClose={() => setActive(null)}
          prefillPersonId={personId}
          prefillFamilyId={familyId}
        />
      )}
      {active === 'notice' && (
        <AddNoticeModal
          onClose={() => setActive(null)}
          prefillPersonId={personId}
          prefillFamilyId={familyId}
        />
      )}
      {active === 'edit' && target.kind === 'person' && (
        <EditPersonDrawer person={target.person} onClose={() => setActive(null)} />
      )}
      {active === 'edit' && target.kind === 'family' && (
        <EditFamilyDrawer family={target.family} onClose={() => setActive(null)} />
      )}

      {confirmAction === 'archive' && isPerson && (
        <ConfirmActionSheet
          {...archiveConfirmCopy(personFirstName, isArchived)}
          tone="neutral"
          onConfirm={handleArchive}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === 'delete' && isPerson && (
        <ConfirmActionSheet
          {...deletePersonConfirmCopy(personFirstName)}
          tone="danger"
          onConfirm={handleDelete}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </td>
  );
}
