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
                  className="min-h-screen flex items-center justify-center"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(85,151,117,1) 6%, rgba(64,143,103,1) 76%, rgba(4,121,65,1) 100%)",
                  }}
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                      <Spinner className="h-12 w-12 text-white" />
                    </div>
                    <div className="text-white text-sm font-medium">Loading...</div>
                  </div>
                </div>
              }
            >
              <LanguageProvider>
                <div
                  className="min-h-screen flex items-center justify-center"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(85,151,117,1) 6%, rgba(64,143,103,1) 76%, rgba(4,121,65,1) 100%)",
                  }}
                >
                  {children}
                </div>
              </LanguageProvider>
            </Suspense>
          </Tooltip.Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
