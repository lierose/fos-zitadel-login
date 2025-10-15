"use client";

import { useState } from "react";
import { Button, ButtonVariants, ButtonColors } from "./button";

export type AppTile = {
  name: string;
  url: string;
  description?: string;
};

export function AppTiles({ apps }: { apps: AppTile[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const onContinue = () => {
    if (selectedIndex != null) {
      const app = apps[selectedIndex];
      if (app?.url) window.location.href = app.url;
    }
  };

  if (!apps || apps.length === 0) return null;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mx-auto mt-3 grid w-full max-w-[420px] grid-cols-2 gap-4 sm:max-w-[420px]">
        {apps.map((app, idx) => {
          const isSelected = selectedIndex === idx;
          return (
            <button
              key={`app-${idx}`}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              aria-pressed={isSelected}
              className={
                "relative group flex h-28 items-center justify-center rounded-md border-2 px-3 transition-all hover:shadow-md " +
                (isSelected
                  ? "border-red-500 bg-white text-red-600 dark:border-red-500 dark:bg-neutral-900 dark:text-red-400"
                  : "border-gray-300 bg-white text-gray-700 hover:border-red-400 hover:text-red-600 dark:border-white/20 dark:bg-neutral-900 dark:text-gray-300 hover:dark:border-red-500 hover:dark:text-red-400")
              }
            >
              <div className="flex flex-col items-start text-left">
                <span className="text-xl font-semibold">{app.name}</span>
                {app.description && (
                  <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">{app.description}</span>
                )}
              </div>
              {isSelected && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white dark:bg-red-500">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-[420px] justify-center">
        <Button
          type="button"
          className="h-8 px-4 text-xs"
          variant={ButtonVariants.Primary}
          color={ButtonColors.Warn}
          disabled={selectedIndex == null}
          onClick={onContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
