"use client";

import { publicAssetPath } from "@/lib/public-asset-path";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "./spinner";

type Props = {
  href?: string;
  width?: number;
  height?: number;
};

export function LogoLink({ href = "/", width = 40, height = 40 }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setLoading(true);
    router.push(href);
  }

  return (
    <div className="relative">
      <button aria-label="Go to home" onClick={handleClick} className="rounded focus:outline-none">
        <img src={publicAssetPath("/fos-op-icon.svg")} alt="Logo" width={width} height={height} />
      </button>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}
