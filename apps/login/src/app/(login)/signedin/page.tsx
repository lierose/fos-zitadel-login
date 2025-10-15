import { Alert, AlertType } from "@/components/alert";
import { Button, ButtonVariants, ButtonColors } from "@/components/button";
import { DynamicTheme } from "@/components/dynamic-theme";
import { Translated } from "@/components/translated";
import { UserAvatar } from "@/components/user-avatar";
import { getMostRecentCookieWithLoginname, getSessionCookieById } from "@/lib/cookies";
import { completeDeviceAuthorization } from "@/lib/server/device";
import { getServiceUrlFromHeaders } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import { getBrandingSettings, getLoginSettings, getSession } from "@/lib/zitadel";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";
import { LogoLink } from "@/components/logo-link";
import { AppTiles } from "@/components/app-tiles";
import { MfaToggle } from "@/components/mfa-toggle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signedin");
  return { title: t("title", { user: "" }) };
}

async function loadSessionById(serviceUrl: string, sessionId: string, organization?: string) {
  const recent = await getSessionCookieById({ sessionId, organization });
  return getSession({
    serviceUrl,
    sessionId: recent.id,
    sessionToken: recent.token,
  }).then((response) => {
    if (response?.session) {
      return response.session;
    }
  });
}

export default async function Page(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const { loginName, requestId, organization, sessionId } = searchParams;

  const branding = await getBrandingSettings({
    serviceUrl,
    organization,
  });

  if (requestId && requestId.startsWith("device_")) {
    const cookie = sessionId
      ? await getSessionCookieById({ sessionId, organization })
      : await getMostRecentCookieWithLoginname({
          loginName: loginName,
          organization: organization,
        });

    await completeDeviceAuthorization(requestId.replace("device_", ""), {
      sessionId: cookie.id,
      sessionToken: cookie.token,
    }).catch((err) => {
      return (
        <DynamicTheme branding={branding}>
          <div className="flex flex-col items-center space-y-4">
            <h1>
              <Translated i18nKey="error.title" namespace="signedin" />
            </h1>
            <p className="ztdl-p mb-6 block">
              <Translated i18nKey="error.description" namespace="signedin" />
            </p>
            <Alert>{err.message}</Alert>
          </div>
        </DynamicTheme>
      );
    });
  }

  const sessionFactors = sessionId
    ? await loadSessionById(serviceUrl, sessionId, organization)
    : await loadMostRecentSession({
        serviceUrl,
        sessionParams: { loginName, organization },
      });

  let loginSettings;
  if (!requestId) {
    loginSettings = await getLoginSettings({
      serviceUrl,
      organization,
    });
  }

  const fosUrl = process.env.NEXT_PUBLIC_FOS_URL;
  const app2Url = process.env.NEXT_PUBLIC_APP2_URL;
  const fosName = process.env.NEXT_PUBLIC_FOS_NAME || "FOS";
  const app2Name = process.env.NEXT_PUBLIC_APP2_NAME || "App2";

  const apps = [
    ...(fosUrl ? [{ name: fosName, url: fosUrl, description: "Main FOS application" }] : []),
    ...(app2Url ? [{ name: app2Name, url: app2Url, description: "Secondary app" }] : []),
  ];

  const mfaParams = new URLSearchParams();
  if (sessionId) mfaParams.set("sessionId", sessionId);
  if (organization) mfaParams.set("organization", organization);
  if (requestId) mfaParams.set("requestId", requestId);
  if (loginName) mfaParams.set("loginName", loginName);

  return (
    <div className="flex w-full justify-center py-8">
      <div className="w-full max-w-[720px] rounded-2xl bg-white p-8 text-center shadow-md ring-1 ring-black/5 dark:bg-neutral-900 dark:text-neutral-100 dark:shadow-xl dark:ring-white/10">
        <div className="mb-4 flex w-full justify-center">
          <LogoLink />
        </div>
        <h1 className="mb-2 text-2xl font-semibold">
          <Translated i18nKey="title" namespace="signedin" data={{ user: sessionFactors?.factors?.user?.displayName }} />
        </h1>
        <p className="ztdl-p mb-3 text-sm text-gray-600 dark:text-gray-300">
          <Translated i18nKey="description" namespace="signedin" />
        </p>

        <div className="mb-4 flex justify-center">
          <UserAvatar
            loginName={loginName ?? sessionFactors?.factors?.user?.loginName}
            displayName={sessionFactors?.factors?.user?.displayName}
            showDropdown={!(requestId && requestId.startsWith("device_"))}
            searchParams={searchParams}
          />
        </div>

        <AppTiles apps={apps} />

        {requestId && requestId.startsWith("device_") && (
          <Alert type={AlertType.INFO}>
            You can now close this window and return to the device where you started the authorization process to continue.
          </Alert>
        )}

        <div className="mx-auto mt-8 flex max-w-[520px] items-center justify-end gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span>Enable MFA</span>
            <MfaToggle href={`/authenticator/set?${mfaParams.toString()}`} />
          </div>
          {loginSettings?.defaultRedirectUri && (
            <Link href={loginSettings?.defaultRedirectUri}>
              <Button type="submit" className="h-10" variant={ButtonVariants.Primary}>
                <Translated i18nKey="continue" namespace="signedin" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
