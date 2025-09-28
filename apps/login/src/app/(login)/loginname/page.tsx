import { LanguageSwitcher } from "@/components/language-switcher";
import { SocialLoginButton } from "@/components/social-login-button";
import { Theme } from "@/components/theme";
import { Translated } from "@/components/translated";
import { UsernameForm } from "@/components/username-form";
import { getServiceUrlFromHeaders } from "@/lib/service-url";
import { getActiveIdentityProviders, getDefaultOrg, getLoginSettings } from "@/lib/zitadel";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
// import logo from "../../../../public/logo1.png";
import Image from "next/image";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("loginname");
  return { title: t("title") };
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;

  const loginName = searchParams?.loginName;
  const requestId = searchParams?.requestId;
  const organization = searchParams?.organization;
  const suffix = searchParams?.suffix;
  const submit: boolean = searchParams?.submit === "true";

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

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: organization ?? defaultOrganization,
  });

  const contextLoginSettings = await getLoginSettings({
    serviceUrl,
    organization,
  });

  const identityProviders = await getActiveIdentityProviders({
    serviceUrl,
    orgId: organization ?? defaultOrganization,
  }).then((resp) => {
    return resp.identityProviders;
  });

  return (
    <div className="relative w-full max-w-6xl bg-white dark:bg-gray-800 rounded-md shadow-md overflow-hidden">
      <div className="flex min-h-[550px]">
        <div className="hidden lg:flex lg:w-1/2  flex-col justify-between relative">
          <div className="absolute right-0 top-12 bottom-12 w-px bg-gray-200 dark:bg-gray-600"></div>

          <div className="flex items-center space-x-3 p-5">
            <Image src={"./logo1.png"} alt="Logo" className="h-18 w-18 object-contain" width={55} height={55} />
          </div>

          <div className="space-y-6 text-left p-12">
            <h1 className="text-3xl font-medium text-gray-900 dark:text-white leading-tight text-left">
              <Translated i18nKey="heroTitle" namespace="loginname" />
            </h1>
            <p className="text-md text-gray-600 dark:text-gray-300 leading-relaxed text-left max-w-xs">
              <Translated i18nKey="heroDescription" namespace="loginname" />
            </p>
            <div className="flex justify-between items-center">
              <Theme />
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-12 flex flex-col justify-end">
          <div className="space-y-9">
            <div>
              <h2 className="text-3xl font-medium text-gray-900 dark:text-white mb-2">
                <Translated i18nKey="title" namespace="loginname" />
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-xs">
                <Translated i18nKey="subtitle" namespace="loginname" />
              </p>
            </div>

            <div className="space-y-6">
              <UsernameForm
                loginName={loginName}
                requestId={requestId}
                organization={organization}
                loginSettings={contextLoginSettings}
                suffix={suffix}
                submit={submit}
                allowRegister={!!loginSettings?.allowRegister}
              />
            </div>

            <div className="space-y-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Social Login Buttons */}
                {identityProviders?.map((idp, index) => {
                  const { id, type } = idp;

                  if (type === 10) {
                    return (
                      <SocialLoginButton
                        key={`google-${index}`}
                        provider="google"
                        id={id}
                        requestId={requestId}
                        organization={organization}
                      />
                    );
                  }

                  if (type === 5) {
                    return (
                      <SocialLoginButton
                        key={`microsoft-${index}`}
                        provider="microsoft"
                        id={id}
                        requestId={requestId}
                        organization={organization}
                      />
                    );
                  }

                  return null;
                })}

                {/* Fallback buttons if no identity providers are configured */}
                {(!identityProviders || identityProviders.length === 0) && (
                  <>
                    <SocialLoginButton provider="google" id="" disabled={true} />
                    <SocialLoginButton provider="microsoft" id="" disabled={true} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
