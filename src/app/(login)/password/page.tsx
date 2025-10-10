import { Alert } from "@/components/alert";
import { PasswordForm } from "@/components/password-form";
import { Translated } from "@/components/translated";
import Image from "next/image";
import { LogoLink } from "@/components/logo-link";
import { getServiceUrlFromHeaders } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import { getBrandingSettings, getDefaultOrg, getLoginSettings } from "@/lib/zitadel";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
// import { BackInline } from "@/components/back-inline";
import { ArrowLeft } from "lucide-react";
import { BackInline } from "@/components/back-inline";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("password");
  return { title: t("verify.title") };
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;
  let { loginName, organization, requestId } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  let defaultOrganization;
  if (!organization) {
    const org: Organization | null = await getDefaultOrg({
      serviceUrl,
    });

    if (org) {
      defaultOrganization = org.id;
    }
  }

  // also allow no session to be found (ignoreUnkownUsername)
  let sessionFactors;
  try {
    sessionFactors = await loadMostRecentSession({
      serviceUrl,
      sessionParams: {
        loginName,
        organization,
      },
    });
  } catch (error) {
    // ignore error to continue to show the password form
    console.warn(error);
  }

  const branding = await getBrandingSettings({
    serviceUrl,
    organization: organization ?? defaultOrganization,
  });
  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: organization ?? defaultOrganization,
  });

  return (
    <div className="relative mx-auto flex w-full max-w-[1200px] flex-row items-center justify-center rounded-2xl p-0">
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
      <div className="relative mx-auto w-full max-w-[480px] min-h-[520px] rounded-2xl bg-white p-8 shadow-md ring-1 ring-black/5 dark:bg-neutral-900 dark:text-neutral-100 dark:shadow-xl dark:ring-white/10 sm:p-10 flex flex-col justify-center">
        <div className="absolute left-5 top-8 flex items-center gap-2">
          <BackInline />
        </div>

        <div className="mb-3 flex w-full items-center justify-center">
          <LogoLink />
        </div>

        <div className="flex flex-col">
          <h1 className="mb-1 text-xl font-semibold text-center">
            <Translated i18nKey="verify.title" namespace="password" />
          </h1>
          <p className="ztdl-p mb-4 text-center text-sm text-gray-600 dark:text-gray-300">
            <Translated i18nKey="verify.description" namespace="password" />
          </p>
          {/* show error only if usernames should be shown to be unknown */}
          {(!sessionFactors || !loginName) && !loginSettings?.ignoreUnknownUsernames && (
            <div className="py-2">
              <Alert>
                <Translated i18nKey="unknownContext" namespace="error" />
              </Alert>
            </div>
          )}
          {loginName && (
            <PasswordForm
              loginName={loginName}
              requestId={requestId}
              organization={organization}
              loginSettings={loginSettings}
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
  );
}
