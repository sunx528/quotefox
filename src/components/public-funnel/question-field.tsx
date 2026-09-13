"use client";

import type { EngineQuestion } from "@/lib/funnel-engine";

export function QuestionField({
  question,
  value,
  onChange,
  onFilesChange,
  files,
}: {
  question: EngineQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
  onFilesChange?: (files: File[]) => void;
  files?: File[];
}) {
  switch (question.type) {
    case "single_choice":
      return (
        <div className="space-y-2">
          {(question.options ?? []).map((opt) => (
            <label
              key={opt.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                value === opt.value ? "border-brand bg-brand/[0.06]" : "border-border bg-surface hover:bg-black/[0.02]"
              }`}
            >
              <input
                type="radio"
                name={question.id}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="h-4 w-4 accent-brand"
              />
              <span className="text-sm font-medium text-foreground">{opt.label}</span>
            </label>
          ))}
        </div>
      );

    case "multiple_choice": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2">
          {(question.options ?? []).map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <label
                key={opt.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                  checked ? "border-brand bg-brand/[0.06]" : "border-border bg-surface hover:bg-black/[0.02]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange(checked ? selected.filter((v) => v !== opt.value) : [...selected, opt.value])
                  }
                  className="h-4 w-4 accent-brand"
                />
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
              </label>
            );
          })}
        </div>
      );
    }

    case "number":
      return (
        <input
          type="number"
          inputMode="decimal"
          value={typeof value === "number" || typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
          placeholder="0"
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      );

    case "email":
      return (
        <input
          type="email"
          inputMode="email"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
          placeholder="vous@exemple.com"
        />
      );

    case "phone":
      return (
        <input
          type="tel"
          inputMode="tel"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
          placeholder="06 12 34 56 78"
        />
      );

    case "location":
      return (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
          placeholder="Adresse ou code postal"
        />
      );

    case "file":
      return (
        <div>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
            onChange={(e) => onFilesChange?.(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-foreground"
          />
          {files && files.length > 0 && (
            <ul className="mt-2 text-xs text-muted">
              {files.map((f) => (
                <li key={f.name}>{f.name}</li>
              ))}
            </ul>
          )}
        </div>
      );

    case "text":
    default:
      return (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      );
  }
}
