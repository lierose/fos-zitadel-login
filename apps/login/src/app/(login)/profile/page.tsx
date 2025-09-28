import { BackIconButton } from "@/components/back-icon-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";
import { Theme } from "@/components/theme";
import { Translated } from "@/components/translated";
import { getBrandingSettings } from "@/lib/zitadel";
import { getJWTFromCookies } from "@/lib/jwt";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profile");
  return { title: t("title") };
}

export default async function ProfilePage() {
  const _headers = await headers();

  const jwtPayload = await getJWTFromCookies();

  if (!jwtPayload) {
    redirect("/loginname");
  }

  const branding = await getBrandingSettings({
    serviceUrl: process.env.ZITADEL_API_URL || "",
    organization: jwtPayload.organizationId,
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 w-1/2">
      <div className="relative w-full  bg-white dark:bg-gray-800 rounded-md shadow-md overflow-hidden">
        <div className="flex min-h-[550px]">
          <div className="w-full  p-12 flex flex-col justify-center ">
            <div className="space-y-6">
              <div className="text-center">
                <div className="h-20 w-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                    {(jwtPayload.displayName || jwtPayload.loginName).charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {jwtPayload.displayName || jwtPayload.loginName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{jwtPayload.loginName}</p>
              </div>

              {/* User Details */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">User ID</label>
                  <p className="text-gray-900 dark:text-white font-mono text-sm mt-1 break-all">{jwtPayload.userId}</p>
                </div>

                {jwtPayload.email && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Email</label>
                    <p className="text-gray-900 dark:text-white mt-1">{jwtPayload.email}</p>
                  </div>
                )}

                {jwtPayload.organizationId && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Organization</label>
                    <p className="text-gray-900 dark:text-white font-mono text-sm mt-1 break-all">
                      {jwtPayload.organizationId}
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Token Expires</label>
                  <p className="text-gray-900 dark:text-white text-sm mt-1">
                    {new Date(jwtPayload.exp * 1000).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <div className="pt-4 w-1/3 mx-auto">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
