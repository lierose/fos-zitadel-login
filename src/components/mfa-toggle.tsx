"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MfaToggle({ href }: { href: string }) {
  const [enabled, setEnabled] = useState(false);
  const router = useRouter();

  const onToggle = () => {
    const next = !enabled;
    setEnabled(next);
    if (next && href) {
      router.push(href);
    }
  };

  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        enabled ? "bg-red-500" : "bg-gray-300 dark:bg-white/20"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
          enabled ? "translate-x-5" : "translate-x-1"
        }`}
      />
      <span className="sr-only">Enable MFA</span>
    </button>
  );
}
