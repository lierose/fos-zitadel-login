import { Alert, AlertType } from "@/components/alert";
import { Button, ButtonVariants } from "@/components/button";
import { DynamicTheme } from "@/components/dynamic-theme";
import { Translated } from "@/components/translated";
import { UserAvatar } from "@/components/user-avatar";
import { getBrandingSettings } from "@/lib/zitadel";
import { getJWTFromCookies, clearJWTCookie } from "@/lib/jwt";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

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
    <DynamicTheme branding={branding}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="mx-auto px-4">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Dashboard</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">JWT Authentication System</p>
                </div>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Welcome Card */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {(jwtPayload.displayName || jwtPayload.loginName).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Welcome back, {jwtPayload.displayName || jwtPayload.loginName}!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">You are successfully authenticated with JWT tokens</p>
                  </div>
                </div>

                <Alert type={AlertType.INFO}>
                  <div className="flex items-start space-x-3">
                    <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <strong className="text-blue-800 dark:text-blue-200">JWT Authentication Active</strong>
                      <p className="text-blue-700 dark:text-blue-300 mt-1">
                        Your session is now managed with JWT tokens instead of traditional sessions. This provides better
                        scalability and stateless authentication.
                      </p>
                    </div>
                  </div>
                </Alert>
              </div>
            </div>

            {/* User Info Card */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">User Information</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">User ID</label>
                    <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                      {jwtPayload.userId}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Login Name</label>
                    <p className="text-gray-900 dark:text-white">{jwtPayload.loginName}</p>
                  </div>

                  {jwtPayload.displayName && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Display Name</label>
                      <p className="text-gray-900 dark:text-white">{jwtPayload.displayName}</p>
                    </div>
                  )}

                  {jwtPayload.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                      <p className="text-gray-900 dark:text-white">{jwtPayload.email}</p>
                    </div>
                  )}

                  {jwtPayload.organizationId && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Organization</label>
                      <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                        {jwtPayload.organizationId}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Token Expires</label>
                    <p className="text-gray-900 dark:text-white text-sm">
                      {new Date(jwtPayload.exp * 1000).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">JWT Token (Raw)</label>
                    <p className="text-gray-900 dark:text-white font-mono text-xs bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded break-all">
                      {JSON.stringify(jwtPayload, null, 2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DynamicTheme>
  );
}
