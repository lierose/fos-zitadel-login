"use client";

import { ColorShade, getColorHash } from "@/helpers/colors";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

interface AvatarProps {
  name: string | null | undefined;
  loginName: string;
  imageUrl?: string;
  size?: "small" | "base" | "large";
  shadow?: boolean;
}

export function getInitials(name: string, loginName: string) {
  let credentials = "";
  if (name) {
    const split = name.split(" ");
    if (split) {
      const initials = split[0].charAt(0) + (split[1] ? split[1].charAt(0) : "");
      credentials = initials;
    } else {
      credentials = name.charAt(0);
    }
  } else {
    const username = loginName.split("@")[0];
    let separator = "_";
    if (username.includes("-")) {
      separator = "-";
    }
    if (username.includes(".")) {
      separator = ".";
    }
    const split = username.split(separator);
    const initials = split[0].charAt(0) + (split[1] ? split[1].charAt(0) : "");
    credentials = initials;
  }

  return credentials;
}

export function Avatar({ size = "base", name, loginName, imageUrl, shadow }: AvatarProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const credentials = getInitials(name ?? loginName, loginName);

  const color: ColorShade = getColorHash(loginName);

  const avatarStyleDark = {
    backgroundColor: color[900],
    color: color[200],
  } as const;

  const avatarStyleLight = {
    backgroundColor: color[200],
    color: color[900],
  } as const;

  // Avoid setting theme-dependent inline styles until after mount to prevent SSR/CSR mismatch
  const style = mounted ? (resolvedTheme === "light" ? avatarStyleLight : avatarStyleDark) : undefined;

  return (
    <div
      className={`dark:group-focus:ring-offset-blue dark:text-blue pointer-events-none flex h-full w-full flex-shrink-0 cursor-default items-center justify-center rounded-full transition-colors duration-200 group-focus:outline-none group-focus:ring-2 group-focus:ring-primary-light-200 dark:group-focus:ring-primary-dark-400 ${
        shadow ? "shadow" : ""
      } ${
        size === "large"
          ? "h-20 w-20 font-normal"
          : size === "base"
            ? "h-[38px] w-[38px] font-bold"
            : size === "small"
              ? "!h-[32px] !w-[32px] text-[13px] font-bold"
              : "h-12 w-12"
      }`}
      style={style}
    >
      {imageUrl ? (
        <Image
          height={48}
          width={48}
          alt="avatar"
          className="h-full w-full rounded-full border border-divider-light dark:border-divider-dark"
          src={imageUrl}
        />
      ) : (
        <span className={`uppercase ${size === "large" ? "text-xl" : "text-13px"}`}>{credentials}</span>
      )}
    </div>
  );
}
