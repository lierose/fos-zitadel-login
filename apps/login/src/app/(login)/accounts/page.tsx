import { BackIconButton } from "@/components/back-icon-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SessionsList } from "@/components/sessions-list";
import { Theme } from "@/components/theme";
import { Translated } from "@/components/translated";
import { getAllSessionCookieIds } from "@/lib/cookies";
import { getServiceUrlFromHeaders } from "@/lib/service-url";
import { getDefaultOrg, listSessions } from "@/lib/zitadel";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";
// import logo from "../../../../public/logo1.png";
import Image from "next/image";

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

  const params = new URLSearchParams();

  if (requestId) {
    params.append("requestId", requestId);
  }

  if (organization) {
    params.append("organization", organization);
  }

  return (
    <div className="relative w-full max-w-6xl bg-white dark:bg-gray-800 rounded-md shadow-md overflow-hidden">
      <div className="flex min-h-[550px]">
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between relative">
          <div className="absolute right-0 top-12 bottom-12 w-px bg-gray-200 dark:bg-gray-600"></div>

          <div className="flex items-center space-x-3 p-5">
            <Image src={"/logo1.png"} alt="Logo" className="h-18 w-18 object-contain" width={55} height={55} />
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

        <div className="w-full lg:w-1/2 p-12 flex flex-col justify-center">
          <div className="space-y-9">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BackIconButton />
                <h2 className="text-3xl font-medium text-gray-900 dark:text-white">
                  <Translated i18nKey="title" namespace="accounts" />
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-xs">
                <Translated i18nKey="description" namespace="accounts" />
              </p>
            </div>

            <div className="space-y-4">
              <SessionsList sessions={sessions} requestId={requestId} />

              <Link href={`/loginname?` + params}>
                <div className="flex flex-row items-center rounded-lg border border-gray-200 px-4 py-3 transition-all hover:bg-gray-50 hover:border-gray-300">
                  <div className="mr-4 flex h-8 w-8 flex-row items-center justify-center rounded-full bg-gray-100">
                    <UserPlusIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">
                    <Translated i18nKey="addAnother" namespace="accounts" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
