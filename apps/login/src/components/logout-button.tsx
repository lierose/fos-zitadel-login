"use client";

import { Button, ButtonVariants } from "./button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      router.push("/loginname");
    } catch (error) {
      router.push("/loginname");
    }
  };

  return (
    <Button variant={ButtonVariants.Secondary} onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">
      Logout
    </Button>
  );
}
