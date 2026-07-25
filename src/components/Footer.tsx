"use client";

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest/95 border-t border-outline-variant/20 text-on-surface-variant font-mono text-[10px] py-6 px-6 mt-auto relative overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-on-surface-variant/70">
        
        {/* Brand & Copyright */}
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center group cursor-pointer select-none no-underline">
            <div className="font-display text-sm font-medium tracking-tight flex items-center text-primary-fixed">
              <span className="font-dancing text-base font-bold italic select-none text-primary-fixed">C</span>
              <span className="text-on-surface">rono</span>
              <span className="font-dancing text-base font-bold italic select-none text-primary-fixed">B</span>
              <span className="text-on-surface">ash</span>
            </div>
          </Link>
          <span>•</span>
          <span>©2026 CronoBash. All rights reserved.</span>
        </div>

        {/* Synchronized Legal Links */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] tracking-tight font-mono">
          <Link href="/terms" className="hover:text-primary-fixed transition-colors">
            Terms of Service
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-primary-fixed transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/legal" className="hover:text-primary-fixed transition-colors">
            Legal &amp; Liability
          </Link>
          <span>•</span>
          <Link href="/refund" className="hover:text-primary-fixed transition-colors">
            Refund Policy
          </Link>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
