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
    <button
      onClick={handleLogout}
      className="w-full text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
      style={{ backgroundColor: "#dc2626" }}
    >
      Logout
    </button>
  );
}
