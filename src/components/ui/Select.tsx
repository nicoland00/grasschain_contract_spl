"use client";

import React from "react";

export type Option = { label: string; value: string; };

interface SelectProps {
  options: Option[];
  value?: string;
  onChange: (v: string) => void;
}

export default function Select({ options, value, onChange }: SelectProps) {
  return (
    <select
      className="input input-bordered w-full max-w-xs"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
