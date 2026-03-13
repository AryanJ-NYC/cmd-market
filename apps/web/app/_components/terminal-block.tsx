"use client";

import { useState } from "react";

export function TerminalBlock({
  command,
  monoClassName,
  title = "terminal"
}: TerminalBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const didCopy = await copyText(command);

    if (!didCopy) {
      return;
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="overflow-hidden border border-white/10 bg-neutral-900">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className={`text-xs text-stone-500 ${monoClassName}`}>{title}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-stone-500 transition-colors hover:text-stone-100"
          aria-label="Copy install command"
          type="button"
        >
          {copied ? (
            <>
              <CheckIcon />
              <span>Copied</span>
            </>
          ) : (
            <>
              <CopyIcon />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className={`p-4 text-sm ${monoClassName}`}>
        <p className="text-stone-400">
          <span className="text-rose-400">$</span> {command}
        </p>
      </div>
    </div>
  );
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the temporary textarea fallback below.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";

  document.body.appendChild(textarea);
  textarea.select();

  const didCopy = document.execCommand("copy");
  document.body.removeChild(textarea);

  return didCopy;
}

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="5.25" y="5.25" width="7.5" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.25 10.5V4.25C3.25 3.69772 3.69772 3.25 4.25 3.25H10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type TerminalBlockProps = {
  command: string;
  monoClassName: string;
  title?: string;
};
