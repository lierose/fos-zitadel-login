"use client";

import { publicAssetPath } from "@/lib/public-asset-path";
import { useResponsiveLayout } from "@/lib/theme-hooks";
import { BrandingSettings } from "@zitadel/proto/zitadel/settings/v2/branding_settings_pb";
import React, { Children, ReactNode } from "react";
import { Card } from "./card";
import { LogoLink } from "./logo-link";
import { ThemeWrapper } from "./theme-wrapper";

/**
 * Keeps upstream authentication pages composable while applying the FOS shell.
 * Page children remain owned by ZITADEL; only their presentation is customized here.
 */
export function DynamicTheme({
  branding,
  children,
}: {
  children: ReactNode | ((isSideBySide: boolean) => ReactNode);
  branding?: BrandingSettings;
}) {
  const { isSideBySide } = useResponsiveLayout();

  const actualChildren: ReactNode = React.useMemo(() => {
    if (typeof children === "function") {
      return (children as (isSideBySide: boolean) => ReactNode)(isSideBySide);
    }
    return children;
  }, [children, isSideBySide]);

  const childArray = Children.toArray(actualChildren);
  const titleContent = childArray[0] || null;
  const formContent = childArray[1] || null;
  const hasMultipleChildren = childArray.length > 1;

  return (
    <ThemeWrapper branding={branding}>
      {isSideBySide ? (
        <div className="relative mx-auto flex w-full max-w-[1200px] items-center justify-center px-4 py-8">
          <FosIllustration side="left" />

          <Card className="relative mx-auto min-h-[520px] w-full max-w-[480px] p-8 shadow-md ring-1 ring-black/5 sm:p-10 dark:shadow-xl dark:ring-white/10">
            <div className="mb-4 flex w-full justify-center">
              <LogoLink />
            </div>
            <div className="flex flex-col space-y-6">
              {hasMultipleChildren && <div className="flex flex-col items-center space-y-4 text-center">{titleContent}</div>}
              <div className="w-full">{hasMultipleChildren ? formContent : titleContent}</div>
            </div>
          </Card>

          <FosIllustration side="right" />
        </div>
      ) : (
        <div className="relative mx-auto w-full max-w-[480px] px-4 py-4">
          <Card className="p-8 shadow-md ring-1 ring-black/5 sm:p-10 dark:shadow-xl dark:ring-white/10">
            <div className="mx-auto flex flex-col items-center space-y-8">
              <LogoLink />
              {hasMultipleChildren ? (
                <>
                  <div className="flex w-full flex-col items-center text-center">{titleContent}</div>
                  <div className="w-full">{formContent}</div>
                </>
              ) : (
                <div className="w-full">{actualChildren}</div>
              )}
            </div>
          </Card>
        </div>
      )}
    </ThemeWrapper>
  );
}

function FosIllustration({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";
  return (
    <div className={`hidden flex-1 flex-col md:flex ${isLeft ? "items-end" : "items-start"}`}>
      <div className={`pointer-events-none flex h-[420px] w-full items-end ${isLeft ? "justify-end" : "justify-start"}`}>
        <img
          src={publicAssetPath(isLeft ? "/firstimage.svg" : "/secondimage.svg")}
          alt=""
          width={420}
          height={420}
          className="h-[320px] w-auto lg:h-[420px] dark:hidden"
        />
        <img
          src={publicAssetPath(isLeft ? "/first-image-dark.svg" : "/second-image-dark.svg")}
          alt=""
          width={420}
          height={420}
          className="hidden h-[320px] w-auto lg:h-[420px] dark:block"
        />
      </div>
      <div className="mt-2 h-px w-[80%] max-w-[420px] bg-gray-200 dark:bg-white/20" />
    </div>
  );
}
