import { Alert } from "@/components/alert";
import { BackButton } from "@/components/back-button";
import { ChooseSecondFactorToSetup } from "@/components/choose-second-factor-to-setup";
import { DynamicTheme } from "@/components/dynamic-theme";
import { Translated } from "@/components/translated";
import { UserAvatar } from "@/components/user-avatar";
import { LogoLink } from "@/components/logo-link";
import { getSessionCookieById } from "@/lib/cookies";
import { getServiceUrlFromHeaders } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import { checkUserVerification } from "@/lib/verify-helper";
import {
  getBrandingSettings,
  getLoginSettings,
  getSession,
  getUserByID,
  listAuthenticationMethodTypes,
} from "@/lib/zitadel";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("authenticator");
  return { title: t("title") };
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;

  const { loginName, requestId, organization, sessionId } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const sessionWithData = sessionId
    ? await loadSessionById(sessionId, organization)
    : await loadSessionByLoginname(loginName, organization);

  async function getAuthMethodsAndUser(serviceUrl: string, session?: Session) {
    const userId = session?.factors?.user?.id;

    if (!userId) {
      throw Error("Could not get user id from session");
    }

    return listAuthenticationMethodTypes({
      serviceUrl,
      userId,
    }).then((methods) => {
      return getUserByID({ serviceUrl, userId }).then((user) => {
        const humanUser = user.user?.type.case === "human" ? user.user?.type.value : undefined;

        return {
          factors: session?.factors,
          authMethods: methods.authMethodTypes ?? [],
          phoneVerified: humanUser?.phone?.isVerified ?? false,
          emailVerified: humanUser?.email?.isVerified ?? false,
          expirationDate: session?.expirationDate,
        };
      });
    });
  }

  async function loadSessionByLoginname(loginName?: string, organization?: string) {
    return loadMostRecentSession({
      serviceUrl,
      sessionParams: {
        loginName,
        organization,
      },
    }).then((session) => {
      return getAuthMethodsAndUser(serviceUrl, session);
    });
  }

  async function loadSessionById(sessionId: string, organization?: string) {
    const recent = await getSessionCookieById({ sessionId, organization });
    return getSession({
      serviceUrl,
      sessionId: recent.id,
      sessionToken: recent.token,
    }).then((sessionResponse) => {
      return getAuthMethodsAndUser(serviceUrl, sessionResponse.session);
    });
  }

  if (!sessionWithData || !sessionWithData.factors || !sessionWithData.factors.user) {
    return (
      <Alert>
        <Translated i18nKey="unknownContext" namespace="error" />
      </Alert>
    );
  }

  const branding = await getBrandingSettings({
    serviceUrl,
    organization: sessionWithData.factors.user?.organizationId,
  });

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: sessionWithData.factors.user?.organizationId,
  });

  if (process.env.EMAIL_VERIFICATION === "true") {
    const isUserVerified = await checkUserVerification(sessionWithData.factors.user?.id);
    if (!isUserVerified) {
      const params = new URLSearchParams({
        loginName: sessionWithData.factors.user.loginName as string,
        invite: "true",
        send: "true",
      });
      if (requestId) params.append("requestId", requestId);
      if (organization || sessionWithData.factors.user.organizationId) {
        params.append("organization", organization ?? (sessionWithData.factors.user.organizationId as string));
      }
      redirect(`/verify?` + params);
    }
  }

  const params = new URLSearchParams({ initial: "true" });
  if (sessionWithData.factors?.user?.loginName) params.set("loginName", sessionWithData.factors?.user?.loginName);
  if (sessionWithData.factors?.user?.organizationId)
    params.set("organization", sessionWithData.factors?.user?.organizationId);
  if (requestId) params.set("requestId", requestId);

  return (
    <div className="flex w-full justify-center py-8">
      <div className="w-full max-w-[720px] rounded-2xl bg-white p-8 text-center shadow-md ring-1 ring-black/5 dark:bg-neutral-900 dark:text-neutral-100 dark:shadow-xl dark:ring-white/10">
        <div className="mb-4 flex w-full justify-center">
          <LogoLink />
        </div>

        <h1 className="mb-2 text-2xl font-semibold">
          <Translated i18nKey="title" namespace="authenticator" />
        </h1>
        <p className="ztdl-p mb-3 text-sm text-gray-600 dark:text-gray-300">
          <Translated i18nKey="description" namespace="authenticator" />
        </p>

        <div className="mb-4 flex justify-center">
          <UserAvatar
            loginName={sessionWithData.factors?.user?.loginName}
            displayName={sessionWithData.factors?.user?.displayName}
            showDropdown
            searchParams={searchParams}
          ></UserAvatar>
        </div>

        {loginSettings && (
          <ChooseSecondFactorToSetup
            userId={sessionWithData.factors.user.id as string}
            loginName={sessionWithData.factors.user.loginName as string}
            sessionId={sessionId as string}
            requestId={requestId as string}
            organization={sessionWithData.factors.user.organizationId as string}
            loginSettings={loginSettings}
            userMethods={sessionWithData.authMethods}
            checkAfter={false}
            phoneVerified={sessionWithData.phoneVerified}
            emailVerified={sessionWithData.emailVerified}
            force={false}
          />
        )}

        <div className="mt-8 flex w-full flex-row items-center">
          <BackButton />
          <span className="flex-grow"></span>
        </div>
      </div>
    </div>
  );
}
