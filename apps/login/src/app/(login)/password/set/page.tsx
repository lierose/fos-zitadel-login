import { Alert, AlertType } from "@/components/alert";
import { SetPasswordForm } from "@/components/set-password-form";
import { Translated } from "@/components/translated";
import Image from "next/image";
import { LogoLink } from "@/components/logo-link";
import { getServiceUrlFromHeaders } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import { getBrandingSettings, getLoginSettings, getPasswordComplexitySettings, getUserByID } from "@/lib/zitadel";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { HumanUser, User } from "@zitadel/proto/zitadel/user/v2/user_pb";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { BackInline } from "@/components/back-inline";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("password");
  return { title: t("set.title") };
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;

  const { userId, loginName, organization, requestId, code, initial } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  // also allow no session to be found (ignoreUnkownUsername)
  let session: Session | undefined;
  if (loginName) {
    session = await loadMostRecentSession({
      serviceUrl,
      sessionParams: {
        loginName,
        organization,
      },
    });
  }

  const branding = await getBrandingSettings({
    serviceUrl,
    organization,
  });

  const passwordComplexity = await getPasswordComplexitySettings({
    serviceUrl,
    organization: session?.factors?.user?.organizationId,
  });

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization,
  });

  let user: User | undefined;
  let displayName: string | undefined;
  if (userId) {
    const userResponse = await getUserByID({
      serviceUrl,
      userId,
    });
    user = userResponse.user;

    if (user?.type.case === "human") {
      displayName = (user.type.value as HumanUser).profile?.displayName;
    }
  }

  return (
    <div className="relative mx-auto flex w-full max-w-[1200px] flex-row items-center justify-center rounded-2xl bg-transparent p-0 ">
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
            <Translated i18nKey="set.title" namespace="password" />
          </h1>
          <p className="ztdl-p mb-4 text-center text-sm text-gray-600 dark:text-gray-300">
            <Translated i18nKey="set.description" namespace="password" />
          </p>

          {loginName && !session && !loginSettings?.ignoreUnknownUsernames && (
            <div className="py-4">
              <Alert>
                <Translated i18nKey="unknownContext" namespace="error" />
              </Alert>
            </div>
          )}

          {session ? (
            <div className="mb-4 flex w-full items-center justify-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {loginName ?? session.factors?.user?.loginName}
              </span>
            </div>
          ) : user ? (
            <div className="mb-4 flex w-full items-center justify-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">{user?.preferredLoginName}</span>
            </div>
          ) : null}

          {!initial && (
            <Alert type={AlertType.INFO}>
              <Translated i18nKey="set.codeSent" namespace="password" />
            </Alert>
          )}

          {passwordComplexity && (loginName ?? user?.preferredLoginName) && (userId ?? session?.factors?.user?.id) ? (
            <SetPasswordForm
              code={code}
              userId={userId ?? (session?.factors?.user?.id as string)}
              loginName={loginName ?? (user?.preferredLoginName as string)}
              requestId={requestId}
              organization={organization}
              passwordComplexitySettings={passwordComplexity}
              codeRequired={!(initial === "true")}
            />
          ) : (
            <div className="py-4">
              <Alert>
                <Translated i18nKey="failedLoading" namespace="error" />
              </Alert>
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
