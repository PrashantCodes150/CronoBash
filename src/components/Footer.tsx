"use client";

import React from 'react';
import Link from 'next/link';

const NAV_ITEMS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Refund Policy', href: '/refund' },
  { label: 'About Us', href: '/#mission' },
  { label: 'Support', href: 'mailto:support@cronobash.com' },
];

export function Footer() {
  return (
    <footer className="bg-surface border-t border-outline-variant/40 py-16 px-6 md:px-16">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">

        {/* Brand & Copyright */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
          <div
            className="text-[30px] leading-none text-[#000000] select-none"
            style={{ fontFamily: '"Special Elite", serif', fontWeight: 400 }}
          >
            CronoBash
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant/80 font-normal">
            ©CronoBash. All rights reserved.
          </p>
        </div>

        {/* Legal & Navigation Links */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 sm:gap-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm text-on-surface-variant hover:text-[#000000] transition-colors font-medium hover:underline"
            >
              {item.label}
            </Link>
          ))}
        </div>

      </div>
    </footer>
  );
}

export default Footer;
