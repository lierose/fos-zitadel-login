"use client";

import { handleIdpLoginWithJWT } from "@/lib/server/idp-login";
import { useEffect, useState } from "react";
import { Spinner } from "./spinner";

type Props = {
  userId: string;
  serviceUrl: string;
  idpUserName?: string;
};

export function IdpJwtHandler({ userId, serviceUrl, idpUserName }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleLogin = async () => {
      try {
        await handleIdpLoginWithJWT(userId, serviceUrl, idpUserName);
      } catch (error) {
        if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
          return;
        }

        setError(error instanceof Error ? error.message : "Login failed");
        setLoading(false);
      }
    };

    handleLogin();
  }, [userId, serviceUrl, idpUserName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <h1>Login Failed</h1>
        <p className="text-red-600">{error}</p>
        <a
          href="/loginname"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to Login
        </a>
      </div>
    );
  }

  return null;
}
