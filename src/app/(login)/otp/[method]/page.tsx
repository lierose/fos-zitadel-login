import { Alert } from "@/components/alert";
import { DynamicTheme } from "@/components/dynamic-theme";
import { LoginOTP } from "@/components/login-otp";
import { Translated } from "@/components/translated";
import { UserAvatar } from "@/components/user-avatar";
import { getSessionCookieById } from "@/lib/cookies";
import { getServiceUrlFromHeaders } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import { getBrandingSettings, getLoginSettings, getSession } from "@/lib/zitadel";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Image from "next/image";
import { LogoLink } from "@/components/logo-link";
import { BackInline } from "@/components/back-inline";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("otp");
  return { title: t("verify.title") };
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
  params: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const host = _headers.get("host");

  if (!host || typeof host !== "string") {
    throw new Error("No host found");
  }

  const { loginName, requestId, sessionId, organization, code } = searchParams;
  const { method } = params;

  const session = sessionId
    ? await loadSessionById(sessionId, organization)
    : await loadMostRecentSession({ serviceUrl, sessionParams: { loginName, organization } });

  async function loadSessionById(sessionId: string, organization?: string) {
    const recent = await getSessionCookieById({ sessionId, organization });
    return getSession({ serviceUrl, sessionId: recent.id, sessionToken: recent.token }).then((response) => {
      if (response?.session) {
        return response.session;
      }
    });
  }

  const branding = await getBrandingSettings({
    serviceUrl,
    organization: organization ?? session?.factors?.user?.organizationId,
  });
  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: organization ?? session?.factors?.user?.organizationId,
  });

  return (
    <div className="flex h-screen items-center justify-center overflow-hidden">
      <div className="relative mx-auto flex w-full max-w-[1200px] flex-row items-center justify-center p-0">
        <div className="hidden flex-1 flex-col items-end md:flex">
          <div className="pointer-events-none flex h-[420px] w-full items-end justify-end">
            <Image
              src="/firstimage.svg"
              alt="Left illustration"
              width={420}
              height={420}
              className="h-[320px] w-auto lg:h-[420px] dark:hidden"
            />
            <Image
              src="/first-image-dark.svg"
              alt="Left illustration dark"
              width={420}
              height={420}
              className="hidden h-[320px] w-auto lg:h-[420px] dark:block"
            />
          </div>
          <div className="mt-2 h-px w-[80%] max-w-[420px] bg-gray-200"></div>
        </div>

        <div className="relative mx-auto w-full max-w-[480px] min-h-[520px] rounded-2xl bg-white p-8 shadow-md ring-1 ring-black/5 dark:bg-neutral-900 dark:text-neutral-100 dark:shadow-xl dark:ring-white/10 sm:p-10">
          <div className="absolute left-5 top-8 flex items-center">
            <BackInline />
          </div>

          <div className="mb-3 flex w-full items-center justify-center">
            <LogoLink />
          </div>

          <div className="flex flex-col">
            <h1 className="mb-1 text-xl font-semibold text-center">
              <Translated i18nKey="verify.title" namespace="otp" />
            </h1>

            {method === "time-based" && (
              <p className="ztdl-p mb-4 text-center text-sm text-gray-600 dark:text-gray-300">
                <Translated i18nKey="verify.totpDescription" namespace="otp" />
              </p>
            )}
            {method === "sms" && (
              <p className="ztdl-p mb-4 text-center text-sm text-gray-600 dark:text-gray-300">
                <Translated i18nKey="verify.smsDescription" namespace="otp" />
              </p>
            )}
            {method === "email" && (
              <p className="ztdl-p mb-4 text-center text-sm text-gray-600 dark:text-gray-300">
                <Translated i18nKey="verify.emailDescription" namespace="otp" />
              </p>
            )}

            {!session && (
              <div className="py-4">
                <Alert>
                  <Translated i18nKey="unknownContext" namespace="error" />
                </Alert>
              </div>
            )}

            {session && (
              <div className="mb-4 flex justify-center">
                <UserAvatar
                  loginName={loginName ?? session.factors?.user?.loginName}
                  displayName={session.factors?.user?.displayName}
                  showDropdown
                  searchParams={searchParams}
                />
              </div>
            )}

            {method && session && (
              <LoginOTP
                loginName={loginName ?? session.factors?.user?.loginName}
                sessionId={sessionId}
                requestId={requestId}
                organization={organization ?? session?.factors?.user?.organizationId}
                method={method}
                loginSettings={loginSettings}
                host={host}
                code={code}
              />
            )}
          </div>
        </div>

        <div className="hidden flex-1 flex-col items-start md:flex">
          <div className="pointer-events-none flex h-[420px] w-full items-end">
            <Image
              src="/secondimage.svg"
              alt="Right illustration"
              width={420}
              height={420}
              className="h-[320px] w-auto lg:h-[420px] dark:hidden"
            />
            <Image
              src="/second-image-dark.svg"
              alt="Right illustration dark"
              width={420}
              height={420}
              className="hidden h-[320px] w-auto lg:h-[420px] dark:block"
            />
          </div>
          <div className="mt-2 h-px w-[80%] max-w-[420px] bg-gray-200"></div>
        </div>
      </div>
    </div>
  );
}
