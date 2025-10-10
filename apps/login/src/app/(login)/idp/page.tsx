import { SignInWithIdp } from "@/components/sign-in-with-idp";
import { Translated } from "@/components/translated";
import { getServiceUrlFromHeaders } from "@/lib/service-url";
import { getActiveIdentityProviders, getBrandingSettings } from "@/lib/zitadel";
import Image from "next/image";
import { LogoLink } from "@/components/logo-link";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("idp");
  return { title: t("title") };
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;

  const requestId = searchParams?.requestId;
  const organization = searchParams?.organization;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const identityProviders = await getActiveIdentityProviders({
    serviceUrl,
    orgId: organization,
  }).then((resp) => {
    return resp.identityProviders;
  });

  const branding = await getBrandingSettings({
    serviceUrl,
    organization,
  });

  return (
    <div className="relative mx-auto flex w-full max-w-[1200px] flex-row items-end justify-center gap-8 rounded-2xl bg-transparent p-0">
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

      <div className="relative mx-auto w-full max-w-[480px] min-h-[520px] rounded-2xl bg-white p-8 shadow-md dark:bg-background-dark-100 sm:p-10">
        <div className="mb-3 flex w-full items-center justify-center">
          <LogoLink />
        </div>
        <div className="flex flex-col">
          <h1 className="mb-1 text-xl font-semibold text-center">
            <Translated i18nKey="title" namespace="idp" />
          </h1>
          <p className="ztdl-p mb-4 text-center text-sm text-gray-600 dark:text-gray-300">
            <Translated i18nKey="description" namespace="idp" />
          </p>

          {!!identityProviders?.length && (
            <SignInWithIdp identityProviders={identityProviders} requestId={requestId} organization={organization} />
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
