"use server";

import {
  createSessionAndUpdateCookie,
  setSessionAndUpdateCookie,
} from "@/lib/server/cookie";
import {
  getLockoutSettings,
  getLoginSettings,
  getPasswordExpirySettings,
  getSession,
  getUserByID,
  listAuthenticationMethodTypes,
  listUsers,
  passwordReset,
  setPassword,
  setUserPassword,
} from "@/lib/zitadel";
import { ConnectError, create, Duration } from "@zitadel/client";
import { createUserServiceClient } from "@zitadel/client/v2";
import {
  Checks,
  ChecksSchema,
} from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { User, UserState } from "@zitadel/proto/zitadel/user/v2/user_pb";
import {
  AuthenticationMethodType,
  SetPasswordRequestSchema,
} from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import { headers } from "next/headers";
import { getNextUrl } from "../client";
import { getSessionCookieById, getSessionCookieByLoginName } from "../cookies";
import { getServiceUrlFromHeaders } from "../service-url";
import { checkUserVerification } from "../verify-helper";
import { createServerTransport } from "../zitadel";
import { cookies as nextCookies } from "next/headers";
import { createJWT, setJWTCookie } from "../jwt";

type ResetPasswordCommand = {
  loginName: string;
  organization?: string;
  requestId?: string;
};

export async function resetPassword(command: ResetPasswordCommand) {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const host = _headers.get("host");

  if (!host || typeof host !== "string") {
    throw new Error("No host found");
  }

  const users = await listUsers({
    serviceUrl,
    loginName: command.loginName,
    organizationId: command.organization,
  });

  if (!users.details || users.details.totalResult !== BigInt(1) || !users.result[0].userId) {
    return { error: "Could not send Password Reset Link" };
  }
  const userId = users.result[0].userId;

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return passwordReset({
    serviceUrl,
    userId,
    urlTemplate:
      `${host.includes("localhost") ? "http://" : "https://"}${host}${basePath}/password/set?code={{.Code}}&userId={{.UserID}}&organization={{.OrgID}}` +
      (command.requestId ? `&requestId=${command.requestId}` : ""),
  });
}

export type UpdateSessionCommand = {
  loginName: string;
  organization?: string;
  checks: Checks;
  requestId?: string;
  authRequest?: string;
};

export async function sendPassword(command: UpdateSessionCommand) {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const users = await listUsers({
    serviceUrl,
    loginName: command.loginName,
    organizationId: command.organization,
  });

  if (!users.details || users.details.totalResult !== BigInt(1) || !users.result[0].userId) {
    return { error: "Could not verify password" };
  }

  const user = users.result[0];

  const checks = create(ChecksSchema, {
    user: { search: { case: "userId", value: user.userId } },
    password: { password: command.checks.password?.password },
  });

  const loginSettings = await getLoginSettings({ serviceUrl, organization: command.organization });

  try {
    const tempSession = await createSessionAndUpdateCookie({
      checks,
      requestId: undefined,
      lifetime: loginSettings?.passwordCheckLifetime,
    });

    const cookieStore = await nextCookies();
    cookieStore.delete("zid");
  } catch (e: any) {
    if ("failedAttempts" in e && e.failedAttempts) {
      const lockout = await getLockoutSettings({ serviceUrl, orgId: command.organization });
      return {
        error:
          `Failed to authenticate. You had ${e.failedAttempts} of ${lockout?.maxPasswordAttempts} password attempts.` +
          (lockout?.maxPasswordAttempts && e.failedAttempts >= lockout?.maxPasswordAttempts
            ? " Contact your administrator to unlock your account"
            : ""),
      };
    }
    return { error: "Could not verify password" };
  }

  const userResponse = await getUserByID({ serviceUrl, userId: user.userId });
  if (!userResponse.user) return { error: "User not found in the system" };

  const fullUser = userResponse.user;
  const humanUser = fullUser?.type.case === "human" ? fullUser.type.value : undefined;

  if (fullUser?.state === UserState.INITIAL) return { error: "Initial User not supported" };

  const expirySettings = await getPasswordExpirySettings({
    serviceUrl,
    orgId: command.organization,
  });

  const authMethodResponse = await listAuthenticationMethodTypes({ serviceUrl, userId: user.userId });
  if (!authMethodResponse?.authMethodTypes?.length) {
    return { error: "No authentication methods configured for user" };
  }

  const jwtToken = await createJWT({
    userId: user.userId,
    loginName: fullUser.preferredLoginName || command.loginName,
    organizationId: command.organization,
    displayName: humanUser?.profile?.displayName,
  });

  await setJWTCookie(jwtToken, 86400);

  console.log("🔑 JWT Token Created:", jwtToken);

  if (command.authRequest || command.requestId) {
    let authRequestId = command.authRequest || command.requestId || "";
    if (authRequestId.startsWith("oidc_")) authRequestId = authRequestId.replace(/^oidc_/, "");

    const finalizeRes = await fetch(`${process.env.ZITADEL_API_URL}/v2/oidc/auth_requests/${authRequestId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.ZITADEL_SERVICE_USER_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        session: {
          sessionId: "jwt-session",
          sessionToken: jwtToken,
        },
      }),
    });

    if (!finalizeRes.ok) {
      const errText = await finalizeRes.text();
      return { error: `OIDC finalize failed (${finalizeRes.status}): ${errText}` };
    }

    const { callbackUrl } = await finalizeRes.json();
    return { redirect: callbackUrl };
  }

  return { redirect: "/profile" };
}

export async function changePassword(command: { code?: string; userId: string; password: string }) {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const { user } = await getUserByID({
    serviceUrl,
    userId: command.userId,
  });

  if (!user || user.userId !== command.userId) {
    return { error: "Could not send Password Reset Link" };
  }
  const userId = user.userId;

  if (user.state === UserState.INITIAL) {
    return { error: "User Initial State is not supported" };
  }

  if (!command.code) {
    const authmethods = await listAuthenticationMethodTypes({
      serviceUrl,
      userId,
    });

    if (authmethods.authMethodTypes.length !== 0) {
      return {
        error: "You have to provide a code or have a valid User Verification Check",
      };
    }

    const hasValidUserVerificationCheck = await checkUserVerification(user.userId);

    if (!hasValidUserVerificationCheck) {
      return { error: "User Verification Check has to be done" };
    }
  }

  return setUserPassword({
    serviceUrl,
    userId,
    password: command.password,
    code: command.code,
  });
}

type CheckSessionAndSetPasswordCommand = {
  sessionId: string;
  password: string;
};

export async function checkSessionAndSetPassword({
  sessionId,
  password,
}: CheckSessionAndSetPasswordCommand) {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const sessionCookie = await getSessionCookieById({ sessionId });

  const { session } = await getSession({
    serviceUrl,
    sessionId: sessionCookie.id,
    sessionToken: sessionCookie.token,
  });

  if (!session || !session.factors?.user?.id) {
    return { error: "Could not load session" };
  }

  const payload = create(SetPasswordRequestSchema, {
    userId: session.factors.user.id,
    newPassword: {
      password,
    },
  });

  // check if the user has no password set in order to set a password
  const authmethods = await listAuthenticationMethodTypes({
    serviceUrl,
    userId: session.factors.user.id,
  });

  if (!authmethods) {
    return { error: "Could not load auth methods" };
  }

  const requiredAuthMethodsForForceMFA = [
    AuthenticationMethodType.OTP_EMAIL,
    AuthenticationMethodType.OTP_SMS,
    AuthenticationMethodType.TOTP,
    AuthenticationMethodType.U2F,
  ];

  const hasNoMFAMethods = requiredAuthMethodsForForceMFA.every(
    (method) => !authmethods.authMethodTypes.includes(method),
  );

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: session.factors.user.organizationId,
  });

  const forceMfa = !!(
    loginSettings?.forceMfa || loginSettings?.forceMfaLocalOnly
  );

  // if the user has no MFA but MFA is enforced, we can set a password otherwise we use the token of the user
  if (forceMfa && hasNoMFAMethods) {
    return setPassword({ serviceUrl, payload }).catch((error) => {
      // throw error if failed precondition (ex. User is not yet initialized)
      if (error.code === 9 && error.message) {
        return { error: "Failed precondition" };
      } else {
        throw error;
      }
    });
  } else {
    const transport = async (serviceUrl: string, token: string) => {
      return createServerTransport(token, serviceUrl);
    };

    const myUserService = async (serviceUrl: string, sessionToken: string) => {
      const transportPromise = await transport(serviceUrl, sessionToken);
      return createUserServiceClient(transportPromise);
    };

    const selfService = await myUserService(
      serviceUrl,
      `${sessionCookie.token}`,
    );

    return selfService
      .setPassword(
        {
          userId: session.factors.user.id,
          newPassword: { password, changeRequired: false },
        },
        {},
      )
      .catch((error: ConnectError) => {
        console.log(error);
        if (error.code === 7) {
          return { error: "Session is not valid." };
        }
        throw error;
      });
  }
}
