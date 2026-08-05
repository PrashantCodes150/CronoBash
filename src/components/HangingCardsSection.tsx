"use client";

import React from 'react';

interface HangingCardsSectionProps {
  children?: React.ReactNode;
}

export default function HangingCardsSection({ children }: HangingCardsSectionProps) {
  return (
    <div className="relative w-full pt-4 pb-4">
      {children}
    </div>
  );
}

export function HangingCardItem({
  children,
  className = ''
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {children}
    </div>
  );
}
