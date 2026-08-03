"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "./spinner";

export function EnableMfaButton({ href, className = "" }: { href: string; className?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (loading) return;
        setLoading(true);
        router.push(href);
      }}
      disabled={loading}
      className={`inline-flex h-8 items-center justify-center rounded-md border px-4 text-xs transition-colors ${
        loading ? "cursor-not-allowed opacity-60" : "hover:bg-red-50"
      } border-[#CE2228] bg-white text-[#CE2228] ${className}`}
    >
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      Enable MFA
    </button>
  );
}
