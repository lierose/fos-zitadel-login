"use client";

import Image from "next/image";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    // global-error must include html and body tags
    <html>
      <body>
        <div className="relative flex h-screen flex-col items-center justify-center overflow-hidden bg-background-light-500 dark:bg-background-dark-600">
          <div className="relative flex max-w-[560px] flex-col items-center text-center">
            <Image src="/error.svg" alt="Error illustration" width={260} height={140} />
            <h1 className="mt-6 text-2xl font-semibold">Oops! Looks like you took a wrong turn</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {error?.message ?? "Please try again or come back later."}
            </p>
            <div className="mt-6 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => reset()}
                className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
              >
                Try Again
              </button>
              <a
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#CE2228] px-4 text-sm font-medium text-white hover:bg-[#B01E24]"
              >
                Go to Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
