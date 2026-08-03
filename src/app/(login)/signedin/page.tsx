import { Alert, AlertType } from "@/components/alert";
import { AppTiles } from "@/components/app-tiles";
import { Button, ButtonVariants } from "@/components/button";
import { DynamicTheme } from "@/components/dynamic-theme";
import { EnableMfaButton } from "@/components/enable-mfa-button";
import { Translated } from "@/components/translated";
import { UserAvatar } from "@/components/user-avatar";
import { resolveRedirectUri } from "@/lib/client";
import { getMostRecentCookieWithLoginname, getSessionCookieById } from "@/lib/cookies";
import { completeDeviceAuthorization } from "@/lib/server/device";
import { getServiceConfig } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import { getBrandingSettings, getLoginSettings, getSession, ServiceConfig } from "@/lib/zitadel";
import { LogOut } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signedin");
  return { title: t("title", { user: "" }) };
}

async function loadSessionById(serviceConfig: ServiceConfig, sessionId: string, organization?: string) {
  const recent = await getSessionCookieById({ sessionId, organization });

  if (!recent) {
    return undefined;
  }

  return getSession({ serviceConfig, sessionId: recent.id, sessionToken: recent.token }).then((response) => {
    if (response?.session) {
      return response.session;
    }
  });
}

export default async function Page(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  const { loginName, requestId, organization, sessionId } = searchParams;

  const branding = await getBrandingSettings({ serviceConfig, organization });

  // complete device authorization flow if device requestId is present
  if (requestId && requestId.startsWith("device_")) {
    const cookie = sessionId
      ? await getSessionCookieById({ sessionId, organization })
      : await getMostRecentCookieWithLoginname({
          loginName: loginName,
          organization: organization,
        });

    if (cookie) {
      await completeDeviceAuthorization(requestId.replace("device_", ""), {
        sessionId: cookie.id,
        sessionToken: cookie.token,
      }).catch((err) => {
        return (
          <DynamicTheme branding={branding}>
            <div className="flex flex-col space-y-4">
              <h1>
                <Translated i18nKey="error.title" namespace="signedin" />
              </h1>
              <p className="ztdl-p mb-6 block">
                <Translated i18nKey="error.description" namespace="signedin" />
              </p>
              <Alert>{err.message}</Alert>
            </div>
            <div className="w-full"></div>
          </DynamicTheme>
        );
      });
    }
  }

  const sessionFactors = sessionId
    ? await loadSessionById(serviceConfig, sessionId, organization)
    : await loadMostRecentSession({ serviceConfig, sessionParams: { loginName, organization } });

  let loginSettings;
  if (!requestId) {
    loginSettings = await getLoginSettings({ serviceConfig, organization });
  }

  const redirectUri = await resolveRedirectUri(
    requestId && sessionId ? { sessionId, requestId } : { loginName: loginName ?? sessionFactors?.factors?.user?.loginName },
    loginSettings?.defaultRedirectUri,
  );

  const isSamePage = redirectUri?.startsWith("/signedin") ?? false;

  const fosUrl = process.env.NEXT_PUBLIC_FOS_URL;
  const app2Url = process.env.NEXT_PUBLIC_APP2_URL;
  const apps = [
    ...(fosUrl
      ? [{ name: process.env.NEXT_PUBLIC_FOS_NAME || "FOS", url: fosUrl, description: "Main FOS application" }]
      : []),
    ...(app2Url ? [{ name: process.env.NEXT_PUBLIC_APP2_NAME || "App2", url: app2Url, description: "Secondary app" }] : []),
  ];

  const mfaParams = new URLSearchParams();
  if (sessionId) mfaParams.set("sessionId", sessionId);
  if (organization) mfaParams.set("organization", organization);
  if (requestId) mfaParams.set("requestId", requestId);
  if (loginName) mfaParams.set("loginName", loginName);

  return (
    <DynamicTheme branding={branding}>
      <div className="flex flex-col space-y-4">
        <h1>
          <Translated i18nKey="title" namespace="signedin" data={{ user: sessionFactors?.factors?.user?.displayName }} />
        </h1>
        <p className="ztdl-p mb-6 block">
          <Translated i18nKey="description" namespace="signedin" />
        </p>

        <UserAvatar
          loginName={loginName ?? sessionFactors?.factors?.user?.loginName}
          displayName={sessionFactors?.factors?.user?.displayName ?? loginName}
          showDropdown={!(requestId && requestId.startsWith("device_"))}
          searchParams={searchParams}
        />
      </div>

      <div className="w-full">
        <AppTiles apps={apps} />

        {requestId && requestId.startsWith("device_") && (
          <Alert type={AlertType.INFO}>
            You can now close this window and return to the device where you started the authorization process to continue.
          </Alert>
        )}

        <div className="mt-8 flex w-full flex-wrap items-center justify-end gap-2">
          {redirectUri && !isSamePage && (
            <Link href={redirectUri}>
              <Button type="submit" className="h-8 px-4 text-xs" variant={ButtonVariants.Primary}>
                <Translated i18nKey="continue" namespace="signedin" />
              </Button>
            </Link>
          )}
          <EnableMfaButton href={`/authenticator/set?${mfaParams.toString()}`} />
          <Link
            aria-label="Logout"
            href="/logout"
            className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-500 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DynamicTheme>
  );
}
