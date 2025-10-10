import { SessionsList } from "@/components/sessions-list";
import { Translated } from "@/components/translated";
import { getAllSessionCookieIds } from "@/lib/cookies";
import { getServiceUrlFromHeaders } from "@/lib/service-url";
import { getBrandingSettings, getDefaultOrg, listSessions } from "@/lib/zitadel";
import Image from "next/image";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";
import { LogoLink } from "@/components/logo-link";
import { BackInline } from "@/components/back-inline";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accounts");
  return { title: t("title") };
}

async function loadSessions({ serviceUrl }: { serviceUrl: string }) {
  const cookieIds = await getAllSessionCookieIds();

  if (cookieIds && cookieIds.length) {
    const response = await listSessions({
      serviceUrl,
      ids: cookieIds.filter((id) => !!id) as string[],
    });
    return response?.sessions ?? [];
  } else {
    console.info("No session cookie found.");
    return [];
  }
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;

  const requestId = searchParams?.requestId;
  const organization = searchParams?.organization;

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

  let sessions = await loadSessions({ serviceUrl });

  const branding = await getBrandingSettings({
    serviceUrl,
    organization: organization ?? defaultOrganization,
  });

  const params = new URLSearchParams();

  if (requestId) params.append("requestId", requestId);
  if (organization) params.append("organization", organization);

  return (
    <div className="relative mx-auto flex w-full max-w-[1200px] flex-row items-center justify-center rounded-2xl bg-transparent p-0">
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
        <div className="absolute left-5 top-8 flex items-center gap-2">
          <BackInline />
        </div>
        <div className="mb-3 flex w-full items-center justify-center">
          <LogoLink />
        </div>
        <div className="flex flex-col">
          <h1 className="mb-1 text-xl font-semibold text-center">
            <Translated i18nKey="title" namespace="accounts" />
          </h1>
          <p className="ztdl-p mb-4 text-center text-sm text-gray-600 dark:text-gray-300">
            <Translated i18nKey="description" namespace="accounts" />
          </p>

          <div className="flex w-full flex-col space-y-2">
            <SessionsList sessions={sessions} requestId={requestId} />
            <Link href={`/loginname?` + params}>
              <div className="flex flex-row items-center rounded-md px-4 py-3 transition-all hover:bg-black/10 dark:hover:bg-white/10">
                <div className="mr-4 flex h-8 w-8 flex-row items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                  <UserPlusIcon className="h-5 w-5" />
                </div>
                <span className="text-sm">
                  <Translated i18nKey="addAnother" namespace="accounts" />
                </span>
              </div>
            </Link>
          </div>
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
