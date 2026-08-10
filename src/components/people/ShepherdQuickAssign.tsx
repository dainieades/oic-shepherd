'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { getShepherdEntries } from '@/lib/utils';
import { BottomSheet } from '@/components/BottomSheet';
import { ShepherdPickerSheet } from '@/components/PersonPickerSheets';

export default function ShepherdQuickAssign({
  currentIds,
  targetName,
  onAssign,
  children,
}: {
  currentIds: string[];
  targetName: string;
  onAssign: (shepherdIds: string[]) => void;
  children: React.ReactNode;
}) {
  const { data } = useApp();
  const [open, setOpen] = React.useState(false);
  const shepherdEntries = React.useMemo(() => getShepherdEntries(data), [data]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-transparent border-none p-0 cursor-pointer text-left"
      >
        {children}
      </button>
      {open && (
        <BottomSheet onClose={() => setOpen(false)} variant="picker-dialog">
          <ShepherdPickerSheet
            entries={shepherdEntries}
            currentIds={currentIds}
            title={`Shepherd of ${targetName}`}
            cancelLabel="Cancel"
            confirmLabel="Save"
            onConfirm={(ids) => {
              onAssign(ids);
              setOpen(false);
            }}
            onBack={() => setOpen(false)}
          />
        </BottomSheet>
      )}
    </>
  );
}
