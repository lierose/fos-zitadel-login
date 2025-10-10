import { DynamicTheme } from "@/components/dynamic-theme";
import { SignInWithIdp } from "@/components/sign-in-with-idp";
import { Translated } from "@/components/translated";
import { UsernameForm } from "@/components/username-form";
import { getServiceUrlFromHeaders } from "@/lib/service-url";
import {
  getActiveIdentityProviders,
  getBrandingSettings,
  getDefaultOrg,
  getLoginSettings,
} from "@/lib/zitadel";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { IdentityProviderType } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import Image from "next/image";
import { LogoLink } from "@/components/logo-link";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import logo from "../../../../public/fos-op-icon.svg";

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

  const branding = await getBrandingSettings({
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
      <div className="relative mx-auto w-full max-w-[480px] min-h-[520px] rounded-2xl bg-white p-8 shadow-md ring-1 ring-black/5 dark:bg-neutral-900 dark:text-neutral-100 dark:shadow-xl dark:ring-white/10 sm:p-10">
        <div className="mb-3 flex w-full items-center justify-center">
          <LogoLink />
        </div>
        <div className="flex flex-col">
          <h1 className="mb-1 text-xl font-semibold text-center">
            <Translated i18nKey="title" namespace="loginname" />
          </h1>
          <p className="ztdl-p mb-4 text-center text-sm text-gray-600 dark:text-gray-300">
            <Translated i18nKey="description" namespace="loginname" />
          </p>
          <div className="mb-4">
            <UsernameForm
              loginName={loginName}
              requestId={requestId}
              organization={organization}
              loginSettings={contextLoginSettings}
              suffix={suffix}
              submit={submit}
              allowRegister={!!loginSettings?.allowRegister}
            ></UsernameForm>
          </div>
          {loginSettings?.allowExternalIdp && !!identityProviders?.length && (
            <div className="w-full pb-2 pt-4">
              <SignInWithIdp
                identityProviders={identityProviders}
                requestId={requestId}
                organization={organization}
                filterTypes={[IdentityProviderType.GOOGLE, IdentityProviderType.AZURE_AD, IdentityProviderType.GITHUB]}
                layout="column"
              ></SignInWithIdp>
            </div>
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
