import { Alert } from "@/components/alert";
import { BackIconButton } from "@/components/back-icon-button";
import { PasswordForm } from "@/components/password-form";
import { Translated } from "@/components/translated";
import { UserAvatar } from "@/components/user-avatar";
import { getServiceUrlFromHeaders } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import { getDefaultOrg, getLoginSettings } from "@/lib/zitadel";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
// import logo from "../../../../public/logo1.png";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Theme } from "@/components/theme";

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

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: organization ?? defaultOrganization,
  });

  return (
    <div className="relative w-full max-w-6xl bg-white dark:bg-gray-800 rounded-md shadow-md overflow-hidden">
      <div className="flex min-h-[550px]">
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between relative">
          <div className="absolute right-0 top-12 bottom-12 w-px bg-gray-200 dark:bg-gray-600"></div>

          <div className="flex items-center space-x-3 p-5">
            <Image src={"./logo1.png"} alt="Logo" className="h-18 w-18 object-contain" width={55} height={55} />
          </div>

          <div className="space-y-6 text-left p-12">
            <h1 className="text-3xl font-medium text-gray-900 dark:text-white leading-tight text-left">
              Secure Password Verification
            </h1>
            <p className="text-md text-gray-600 dark:text-gray-300 leading-relaxed text-left max-w-xs">
              Complete your authentication with your secure password to access your account.
            </p>
            <div className="flex justify-between items-center">
              <Theme />
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-12 flex flex-col">
          <div className="space-y-9">
            {/* Header */}
            <BackIconButton />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-medium text-gray-900 dark:text-white">
                  {sessionFactors?.factors?.user?.displayName ?? <Translated i18nKey="verify.title" namespace="password" />}
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-xs">
                <Translated i18nKey="verify.subtitle" namespace="password" />
              </p>
            </div>

            {sessionFactors && (
              <div className="text-center">
                <UserAvatar
                  loginName={loginName ?? sessionFactors.factors?.user?.loginName}
                  displayName={sessionFactors.factors?.user?.displayName}
                  showDropdown
                  searchParams={searchParams}
                />
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

            {(!sessionFactors || !loginName) && !loginSettings?.ignoreUnknownUsernames && (
              <Alert>
                <Translated i18nKey="unknownContext" namespace="error" />
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
