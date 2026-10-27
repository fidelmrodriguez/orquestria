"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";

const FOCUSABLE = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])'
].join(", ");

/** Gerencia foco, Tab, Escape configurável e rolagem para painéis e diálogos modais. */
export function useAccessiblePanel<T extends HTMLElement>(
  active: boolean,
  onClose: () => void,
  initialFocusSelector?: string,
  closeOnEscape = true
) {
  const panelRef = useRef<T>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!active || !panelRef.current) return;
    const panel = panelRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const selected = initialFocusSelector ? panel.querySelector<HTMLElement>(initialFocusSelector) : null;
    (selected || panel).focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [active, initialFocusSelector]);

  const onKeyDown = (event: KeyboardEvent<T>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      event.preventDefault();
      if (closeOnEscape) closeRef.current();
      return;
    }
    if (event.key !== "Tab") return;

    const panel = panelRef.current;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      .filter((element) => !element.closest('[hidden], [aria-hidden="true"]') &&
        getComputedStyle(element).display !== "none" && getComputedStyle(element).visibility !== "hidden");
    // Visibilidade calculada também pode ser inspecionada durante os testes no jsdom.
    if (!items.length) {
      event.preventDefault();
      panel.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last)) {
      event.preventDefault();
      first.focus();
    }
  };

  return { panelRef, onKeyDown };
}
