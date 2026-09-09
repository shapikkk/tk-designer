import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface NumberFieldProps {
  value: number | undefined;
  onCommit: (value: number) => void;
  onClear?: () => void;
  allowFraction?: boolean;
  min?: number;
  max?: number;
  id?: string;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
}

const text = (value: number | undefined) =>
  value === undefined ? "" : String(value);

export function NumberField({
  value,
  onCommit,
  onClear,
  allowFraction,
  min,
  max,
  id,
  className,
  ...rest
}: NumberFieldProps) {
  const [draft, setDraft] = useState(text(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(text(value));
  }, [value]);

  const commit = () => {
    if (draft.trim() === "") {
      if (onClear) {
        onClear();
        return;
      }
      setDraft(text(value));
      return;
    }

    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(text(value));
      return;
    }

    let next = allowFraction ? parsed : Math.round(parsed);
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    setDraft(String(next));
    if (next !== value) onCommit(next);
  };

  return (
    <Input
      {...rest}
      id={id}
      className={className}
      type="number"
      inputMode="numeric"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={() => (focused.current = true)}
      onBlur={() => {
        focused.current = false;
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          setDraft(text(value));
          e.currentTarget.blur();
        }
      }}
    />
  );
}
