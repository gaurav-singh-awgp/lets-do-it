import { type FormEvent, useId, useRef, useState } from "react";
import {
  countUnicodeCodePoints,
  MAX_TODO_TEXT_CODE_POINTS,
} from "../../lib/todoTextLimits";
import { ApiEnvelopeError } from "../../api/todosClient";

type Props = {
  onCreate: (text: string) => Promise<void>;
  submitting: boolean;
};

const EMPTY_MSG =
  "Enter a short description before adding. Whitespace alone is not enough.";
const LENGTH_MSG = `Keep todo text at or below ${MAX_TODO_TEXT_CODE_POINTS} characters (Unicode).`;

export function AddTodoForm({ onCreate, submitting }: Props) {
  const [text, setText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitLockRef = useRef(false);
  const reactId = useId();
  const errorId = `${reactId}-todo-validation`;

  function announceValidationError(nextError: string) {
    if (validationError === nextError) {
      setValidationError(null);
      queueMicrotask(() => {
        setValidationError(nextError);
      });
      return;
    }
    setValidationError(nextError);
  }

  function validateForSubmit(trimmed: string): string | null {
    if (!trimmed) return EMPTY_MSG;
    if (countUnicodeCodePoints(trimmed) > MAX_TODO_TEXT_CODE_POINTS) {
      return LENGTH_MSG;
    }
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting || submitLockRef.current) return;
    const trimmed = text.trim();
    const err = validateForSubmit(trimmed);
    if (err) {
      announceValidationError(err);
      return;
    }
    setValidationError(null);
    submitLockRef.current = true;
    try {
      await onCreate(trimmed);
      setText("");
      inputRef.current?.focus();
    } catch (error) {
      if (error instanceof ApiEnvelopeError) {
        queueMicrotask(() => {
          inputRef.current?.focus();
        });
        return;
      }
      throw error;
    } finally {
      submitLockRef.current = false;
    }
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <label htmlFor="todo-new" className="sr-only">
        New todo
      </label>
      <input
        ref={inputRef}
        id="todo-new"
        className="todo-input"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (validationError) setValidationError(null);
        }}
        placeholder="What needs doing?"
        autoComplete="off"
        disabled={submitting}
        aria-invalid={validationError ? true : undefined}
        aria-describedby={validationError ? errorId : undefined}
      />
      <button type="submit" disabled={submitting}>
        Add
      </button>
      {submitting ? (
        <span className="todo-pending-status" role="status">
          Adding…
        </span>
      ) : null}
      <p
        id={errorId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={
          validationError
            ? "todo-field-error w-full basis-full text-sm text-error-fg"
            : "sr-only"
        }
      >
        {validationError ?? ""}
      </p>
    </form>
  );
}
