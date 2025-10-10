"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackInline() {
  const router = useRouter();
  return (
    <button
      aria-label="Go back"
      onClick={() => router.back()}
      className="rounded p-1 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
    >
      <ArrowLeft size={20} />
    </button>
  );
}
