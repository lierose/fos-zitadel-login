import "@/styles/globals.scss";

import { LanguageProvider } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Spinner } from "@/components/spinner";
import { Theme } from "@/components/theme";
import { ThemeProvider } from "@/components/theme-provider";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Lato } from "next/font/google";
import { ReactNode, Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

const lato = Lato({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: t("title") };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={`${lato.className}`} suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider>
          <Tooltip.Provider>
            <Suspense
              fallback={
                <div
                  className={`relative flex min-h-screen flex-col justify-center bg-background-light-400 dark:bg-background-dark-600`}
                >
                  <div className="relative mx-auto flex w-full max-w-[1100px] flex-col items-center py-16">
                    <Spinner className="h-10 w-10" />
                  </div>
                </div>
              }
            >
              <LanguageProvider>
                <div className="relative flex h-screen flex-col overflow-hidden bg-background-light-500 dark:bg-background-dark-700">
                  <div className="flex flex-row items-center justify-end space-x-4 p-4">
                    <LanguageSwitcher />
                    <Theme />
                  </div>
                  <div className="flex flex-1 items-center justify-center">
                    <div className="relative mx-auto w-full max-w-[1200px] px-4">{children}</div>
                  </div>
                </div>
              </LanguageProvider>
            </Suspense>
          </Tooltip.Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
