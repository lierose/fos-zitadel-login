"use client";

import * as React from "react";
import Image from "next/image";
import { ColorShade, getColorHash } from "@/helpers/colors";

interface AvatarProps {
  name: string | null | undefined;
  loginName: string;
  imageUrl?: string;
  size?: "small" | "base" | "large";
  shadow?: boolean;
}

export function getInitials(name: string | null | undefined, loginName: string) {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? "").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
  }
  const username = loginName.split("@")[0] ?? loginName;
  const sep = username.includes(".") ? "." : username.includes("-") ? "-" : "_";
  const bits = username.split(sep);
  return (bits[0]?.[0] ?? "").toUpperCase() + (bits[1]?.[0] ?? "").toUpperCase();
}

export function Avatar({ size = "base", name, loginName, imageUrl, shadow }: AvatarProps) {
  const credentials = getInitials(name, loginName);
  const color: ColorShade = getColorHash(loginName);

  const cssVars = {
    // light palette
    ["--avatar-bg-light" as any]: color[200],
    ["--avatar-fg-light" as any]: color[900],
    // dark palette
    ["--avatar-bg-dark" as any]: color[900],
    ["--avatar-fg-dark" as any]: color[200],
  } as React.CSSProperties;

  const sizeClasses =
    size === "large"
      ? "h-20 w-20 font-normal"
      : size === "base"
        ? "h-[38px] w-[38px] font-bold"
        : size === "small"
          ? "!h-[32px] !w-[32px] text-[13px] font-bold"
          : "h-12 w-12";

  return (
    <div
      className={`pointer-events-none flex h-full w-full flex-shrink-0 cursor-default items-center justify-center rounded-full transition-colors duration-200
      bg-[var(--avatar-bg-light)] text-[var(--avatar-fg-light)]
      dark:bg-[var(--avatar-bg-dark)] dark:text-[var(--avatar-fg-dark)]
      ${shadow ? "shadow" : ""} ${sizeClasses}
      group-focus:outline-none group-focus:ring-2 group-focus:ring-primary-light-200 dark:group-focus:ring-primary-dark-400`}
      style={cssVars}
    >
      {imageUrl ? (
        <Image
          height={48}
          width={48}
          alt="avatar"
          className="h-full w-full rounded-full border border-divider-light dark:border-divider-dark object-cover"
          src={imageUrl}
        />
      ) : (
        <span className={`uppercase ${size === "large" ? "text-xl" : "text-13px"}`}>{credentials}</span>
      )}
    </div>
  );
}
