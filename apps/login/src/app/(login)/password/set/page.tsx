import { BackIconButton } from "@/components/back-icon-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SetPasswordForm } from "@/components/set-password-form";
import { Theme } from "@/components/theme";
import { Translated } from "@/components/translated";
import { UserAvatar } from "@/components/user-avatar";
import { getServiceUrlFromHeaders } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import { getLoginSettings, getPasswordComplexitySettings, getUserByID } from "@/lib/zitadel";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { HumanUser, User } from "@zitadel/proto/zitadel/user/v2/user_pb";
import { Metadata } from "next";

import { headers } from "next/headers";
import Image from "next/image";
// import logo from "../../../../../public/logo1.png";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Reset Password" };
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
    <div className="relative w-full max-w-6xl bg-white dark:bg-gray-800 rounded-md shadow-md overflow-hidden">
      <div className="flex min-h-[550px]">
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between relative">
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
              <div className="flex items-center gap-3 mb-2">
                <BackIconButton />
                <h2 className="text-3xl font-medium text-gray-900">
                  {session?.factors?.user?.displayName ?? <Translated i18nKey="set.title" namespace="password" />}
                </h2>
              </div>
              <p className="text-gray-600 text-xs">
                <Translated i18nKey="set.description" namespace="password" />
              </p>
            </div>

            {session ? (
              <div className="text-center">
                <UserAvatar
                  loginName={loginName ?? session.factors?.user?.loginName}
                  displayName={session.factors?.user?.displayName}
                  showDropdown
                  searchParams={searchParams}
                />
              </div>
            ) : user ? (
              <div className="text-center">
                <UserAvatar
                  loginName={user?.preferredLoginName}
                  displayName={displayName}
                  showDropdown
                  searchParams={searchParams}
                />
              </div>
            ) : null}

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
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                  <Translated i18nKey="failedLoading" namespace="error" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
