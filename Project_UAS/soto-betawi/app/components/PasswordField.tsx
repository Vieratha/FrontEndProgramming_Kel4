"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";

// INI BAGIAN TIPE DATA PASSWORD FIELD
type PasswordFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  required?: boolean;
};

// INI BAGIAN KOMPONEN INPUT PASSWORD
export default function PasswordField({
  id,
  label,
  placeholder,
  value,
  onChange,
  autoComplete,
  required = true,
}: PasswordFieldProps) {
  // INI BAGIAN STATUS VISIBILITAS PASSWORD
  const [showPassword, setShowPassword] = useState(false);

  // INI BAGIAN MENGUBAH NILAI PASSWORD
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>

      <div className="password-input-wrapper">
        <input
          className="password-input"
          type={showPassword ? "text" : "password"}
          id={id}
          name={id}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          autoComplete={autoComplete}
          required={required}
        />

        {/* INI BAGIAN TOMBOL LIHAT PASSWORD */}
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword((previous) => !previous)}
          aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
          aria-pressed={showPassword}
          title={showPassword ? "Sembunyikan password" : "Lihat password"}
        >
          {showPassword ? (
            /* INI BAGIAN ICON MATA TERTUTUP */
            <svg
              viewBox="0 0 24 24"
              width="21"
              height="21"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 5.2A11.5 11.5 0 0 1 12 5c5.5 0 9.5 7 9.5 7a16 16 0 0 1-3.1 3.8" />
              <path d="M6.2 6.2C3.9 7.8 2.5 12 2.5 12s4 7 9.5 7a10.8 10.8 0 0 0 4-.8" />
            </svg>
          ) : (
            /* INI BAGIAN ICON MATA TERBUKA */
            <svg
              viewBox="0 0 24 24"
              width="21"
              height="21"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
