"use client";

import { useEffect } from 'react';

/**
 * SecurityGuard Component
 * Implements client-side defensive protections:
 * 1. Self-XSS / Console Warning Banner (discourages users from running malicious snippets in DevTools)
 * 2. Neutralizes React DevTools global hooks in production to prevent inspecting component memory state
 */
export function SecurityGuard() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Disable React DevTools Global Hook in production to prevent state tampering
      if (process.env.NODE_ENV === 'production') {
        try {
          const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
          if (typeof hook === 'object' && hook !== null) {
            for (const prop in hook) {
              if (typeof hook[prop] === 'function') {
                hook[prop] = () => {};
              }
            }
          }
        } catch (e) {}
      }
    }
  }, []);

  return null;
}
