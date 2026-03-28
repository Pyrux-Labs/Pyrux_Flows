"use client";

import { useState } from "react";

/**
 * Intercepts sheet close events when the form has unsaved changes.
 * Shows a confirmation dialog before discarding.
 */
export function useUnsavedChanges(
  isDirty: boolean,
  onOpenChange: (open: boolean) => void,
) {
  const [warningOpen, setWarningOpen] = useState(false);

  // Pass this to <Sheet onOpenChange={...}> and the Cancel button
  function handleOpenChange(open: boolean) {
    if (!open && isDirty) {
      setWarningOpen(true);
    } else {
      onOpenChange(open);
    }
  }

  // User confirmed discarding changes
  function confirmDiscard() {
    setWarningOpen(false);
    onOpenChange(false);
  }

  // User chose to keep editing
  function cancelDiscard() {
    setWarningOpen(false);
  }

  return { handleOpenChange, warningOpen, confirmDiscard, cancelDiscard };
}
