"use client";

import { useEffect, useRef } from "react";
import { activateWorkspaceAction } from "./actions";

export function WorkspaceActivationForm({
  autoSubmit = false,
  buttonLabel,
  organizationId
}: WorkspaceActivationFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (autoSubmit) {
      formRef.current?.requestSubmit();
    }
  }, [autoSubmit]);

  return (
    <form action={activateWorkspaceAction} className="space-y-3" ref={formRef}>
      <input name="organizationId" type="hidden" value={organizationId} />
      <button className={getButtonClassName(autoSubmit)} type="submit">
        {buttonLabel}
      </button>
      {autoSubmit ? (
        <p className="text-xs text-stone-500">Submitting automatically. Use the button if your browser blocks it.</p>
      ) : null}
    </form>
  );
}

function getButtonClassName(autoSubmit: boolean) {
  if (autoSubmit) {
    return "rounded-full border border-stone-700 bg-stone-100 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-white";
  }

  return "rounded-full border border-stone-700 px-4 py-2 text-sm font-medium text-stone-100 transition hover:border-stone-500 hover:bg-stone-800";
}

type WorkspaceActivationFormProps = {
  autoSubmit?: boolean;
  buttonLabel: string;
  organizationId: string;
};
