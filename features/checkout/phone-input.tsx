"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";

export function normalizeRussianPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const normalized = digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
  return normalized.startsWith("7") ? normalized.slice(0, 11) : `7${normalized.slice(0, 10)}`;
}

export function formatRussianPhone(value: string) {
  const digits = normalizeRussianPhone(value);
  if (!digits) return "";
  const local = digits.slice(1);
  let result = "+7";
  if (local.length > 0) result += ` (${local.slice(0, 3)}`;
  if (local.length >= 3) result += ")";
  if (local.length > 3) result += ` ${local.slice(3, 6)}`;
  if (local.length > 6) result += `-${local.slice(6, 8)}`;
  if (local.length > 8) result += `-${local.slice(8, 10)}`;
  return result;
}

type PhoneInputProps<TValues extends FieldValues> = {
  control: Control<TValues>;
  name: FieldPath<TValues>;
  autoComplete?: "tel" | "tel-national";
};

export function PhoneInput<TValues extends FieldValues>({
  control,
  name,
  autoComplete = "tel",
}: PhoneInputProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <input
          {...field}
          value={formatRussianPhone(String(field.value ?? ""))}
          onChange={(event) => field.onChange(normalizeRussianPhone(event.target.value))}
          inputMode="tel"
          className="form-input"
          placeholder="+7 (999) 000-00-00"
          autoComplete={autoComplete}
        />
      )}
    />
  );
}
