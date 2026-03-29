"use client";

import { useEffect } from "react";

/**
 * Registers a global Cmd+N / Ctrl+N keyboard shortcut.
 * Calls `onCreate` when triggered, unless the user is focused
 * on an input, textarea, or contentEditable element.
 */
export function useCreateShortcut(onCreate: () => void) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        onCreate();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCreate]);
}
