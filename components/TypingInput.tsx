"use client";

import { useRef, useState, type Ref } from "react";
import { TextField } from "@/components/ui";

/** Browser composition behavior shared by live races and personal practice. */
export function TypingInput({
  id,
  label,
  value,
  onInput,
  disabled,
  placeholder,
  description,
  describedBy,
  inputRef,
}: {
  id: string;
  label: string;
  value: string;
  onInput: (value: string, composed?: boolean) => void;
  disabled: boolean;
  placeholder: string;
  description: string;
  describedBy: string;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const [compositionDraft, setCompositionDraft] = useState<string | null>(null);
  const composing = useRef(false);
  return (
    <TextField
      id={id}
      inputRef={inputRef}
      data-testid="race-input"
      label={label}
      inputClassName="typing-input"
      description={description}
      value={compositionDraft ?? value}
      onCompositionStart={(event) => {
        composing.current = true;
        setCompositionDraft(event.currentTarget.value);
      }}
      onCompositionEnd={(event) => {
        composing.current = false;
        onInput(event.currentTarget.value, true);
        setCompositionDraft(null);
      }}
      onChange={(event) => {
        if (
          composing.current ||
          ("isComposing" in event.nativeEvent && event.nativeEvent.isComposing)
        )
          setCompositionDraft(event.target.value);
        else onInput(event.target.value);
      }}
      onClick={(event) =>
        event.currentTarget.setSelectionRange(
          event.currentTarget.value.length,
          event.currentTarget.value.length,
        )
      }
      onDrop={(event) => event.preventDefault()}
      name={`${id}-input`}
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      disabled={disabled}
      placeholder={placeholder}
      aria-describedby={describedBy}
    />
  );
}
