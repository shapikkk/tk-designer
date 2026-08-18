import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface NumberFieldProps {
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

/** A numeric input that keeps its own draft text while focused, so a partially
 *  typed value ("", "-", "12") never fights the committed state. Garbage input
 *  reverts on blur instead of being rejected mid-keystroke. */
export function NumberField({
  value,
  onCommit,
  min,
  max,
  id,
  className,
  ...rest
}: NumberFieldProps) {
  const [draft, setDraft] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(String(value));
  }, [value]);

  const commit = () => {
    const parsed = Number(draft);
    if (draft.trim() === "" || !Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    let next = Math.round(parsed);
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
          setDraft(String(value));
          e.currentTarget.blur();
        }
      }}
    />
  );
}
