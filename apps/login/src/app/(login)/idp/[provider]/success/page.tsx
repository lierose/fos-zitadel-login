import { DynamicTheme } from "@/components/dynamic-theme";
import { IdpJwtHandler } from "@/components/idp-jwt-handler";
import { IdpSignin } from "@/components/idp-signin";
import { completeIDP } from "@/components/idps/pages/complete-idp";
import { linkingFailed } from "@/components/idps/pages/linking-failed";
import { linkingSuccess } from "@/components/idps/pages/linking-success";
import { loginFailed } from "@/components/idps/pages/login-failed";
import { loginSuccess } from "@/components/idps/pages/login-success";
import { Translated } from "@/components/translated";
import { getServiceUrlFromHeaders } from "@/lib/service-url";
import {
  addHuman,
  addIDPLink,
  getBrandingSettings,
  getDefaultOrg,
  getIDPByID,
  getLoginSettings,
  getOrgsByDomain,
  getUserByID,
  listUsers,
  retrieveIDPIntent,
  updateHuman,
} from "@/lib/zitadel";
import { ConnectError, create } from "@zitadel/client";
import { AutoLinkingOption } from "@zitadel/proto/zitadel/idp/v2/idp_pb";
import { OrganizationSchema } from "@zitadel/proto/zitadel/object/v2/object_pb";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import {
  AddHumanUserRequest,
  AddHumanUserRequestSchema,
  UpdateHumanUserRequestSchema,
} from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import { headers } from "next/headers";
import { createJWTAndRedirectToProfile } from "@/lib/server/idp-login";

const ORG_SUFFIX_REGEX = /(?<=@)(.+)/;

async function resolveOrganizationForUser({
  organization,
  addHumanUser,
  serviceUrl,
}: {
  organization?: string;
  addHumanUser?: { username?: string };
  serviceUrl: string;
}): Promise<string | undefined> {
  if (organization) return organization;

  if (addHumanUser?.username && ORG_SUFFIX_REGEX.test(addHumanUser.username)) {
    const matched = ORG_SUFFIX_REGEX.exec(addHumanUser.username);
    const suffix = matched?.[1] ?? "";

    const orgs = await getOrgsByDomain({
      serviceUrl,
      domain: suffix,
    });
    const orgToCheckForDiscovery = orgs.result && orgs.result.length === 1 ? orgs.result[0].id : undefined;

    if (orgToCheckForDiscovery) {
      const orgLoginSettings = await getLoginSettings({
        serviceUrl,
        organization: orgToCheckForDiscovery,
      });
      if (orgLoginSettings?.allowDomainDiscovery) {
        return orgToCheckForDiscovery;
      }
    }
  }
  return undefined;
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
  params: Promise<{ provider: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  let { id, token, requestId, organization, link } = searchParams;
  const { provider } = params;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  let branding = await getBrandingSettings({
    serviceUrl,
    organization,
  });

  if (!organization) {
    const org: Organization | null = await getDefaultOrg({
      serviceUrl,
    });
    if (org) {
      organization = org.id;
    }
  }

  if (!provider || !id || !token) {
    return loginFailed(branding, "IDP context missing");
  }

  const intent = await retrieveIDPIntent({
    serviceUrl,
    id,
    token,
  });

  const { idpInformation, userId } = intent;
  let { addHumanUser } = intent;

  if (!idpInformation) {
    return loginFailed(branding, "IDP information missing");
  }

  const idp = await getIDPByID({
    serviceUrl,
    id: idpInformation.idpId,
  });

  const options = idp?.config?.options;

  if (!idp) {
    throw new Error("IDP not found");
  }

  // sign in user. If user should be linked continue
  if (userId && !link) {
    // if auto update is enabled, we will update the user with the new information
    if (options?.isAutoUpdate && addHumanUser) {
      try {
        await updateHuman({
          serviceUrl,
          request: create(UpdateHumanUserRequestSchema, {
            userId: userId,
            profile: addHumanUser.profile,
            email: addHumanUser.email,
            phone: addHumanUser.phone,
          }),
        });
      } catch (error: unknown) {
        // Log the error and continue with the login process
        console.warn("An error occurred while updating the user:", error);
      }
    }

    return (
      <DynamicTheme branding={branding}>
        <div className="flex flex-col items-center space-y-4">
          <h1>Completing Login...</h1>
          <p className="ztdl-p">Please wait while we complete your authentication.</p>
          <IdpJwtHandler userId={userId} serviceUrl={serviceUrl} idpUserName={idpInformation.userName} />
        </div>
      </DynamicTheme>
    );
  }

  if (!userId) {
    if (idpInformation?.userName && options?.isLinkingAllowed) {
      try {
   
        let users = await listUsers({
          serviceUrl,
          email: idpInformation.userName,
        });

        if ((!users.result || users.result.length === 0) && idpInformation.userName) {
          users = await listUsers({
            serviceUrl,
            userName: idpInformation.userName,
          });
        }

        if ((!users.result || users.result.length === 0) && idpInformation.userName) {
          users = await listUsers({
            serviceUrl,
            loginName: idpInformation.userName,
          });
        }

        let candidateUserId = users.result?.[0]?.userId as string | undefined;
        if (users.result && users.result.length > 1 && organization) {
          const inOrg = users.result.find((u: any) => u?.details?.resourceOwner === organization);
          if (inOrg?.userId) candidateUserId = inOrg.userId as string;
        }

        if (candidateUserId) {
          const foundUserId = candidateUserId;

          const idpLink = await addIDPLink({
            serviceUrl,
            idp: {
              id: idpInformation.idpId,
              userId: idpInformation.userId,
              userName: idpInformation.userName,
            },
            userId: foundUserId,
          });

          if (idpLink) {
            return (
              <DynamicTheme branding={branding}>
                <div className="flex flex-col items-center space-y-4">
                  <h1>Completing Login...</h1>
                  <p className="ztdl-p">Please wait while we complete your authentication.</p>
                  <IdpJwtHandler userId={foundUserId} serviceUrl={serviceUrl} idpUserName={idpInformation.userName} />
                </div>
              </DynamicTheme>
            );
          }
        }
      } catch (error) {
        console.error("Error during user linking:", error);
      }
    }

    return (
      <DynamicTheme branding={branding}>
        <div className="flex flex-col items-center space-y-4">
          <h1>
            <Translated i18nKey="userNotFound.title" namespace="idp" />
          </h1>
          <p className="ztdl-p">
            <Translated i18nKey="userNotFound.description" namespace="idp" />
          </p>
          <div className="mt-4">
            <a
              href="/loginname"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Translated i18nKey="userNotFound.backToLogin" namespace="idp" />
            </a>
          </div>
        </div>
      </DynamicTheme>
    );
  }

  if (link) {
    if (!options?.isLinkingAllowed) {
      // linking was probably disallowed since the invitation was created
      return linkingFailed(branding, "Linking is no longer allowed");
    }

    let idpLink;
    try {
      idpLink = await addIDPLink({
        serviceUrl,
        idp: {
          id: idpInformation.idpId,
          userId: idpInformation.userId,
          userName: idpInformation.userName,
        },
        userId,
      });
    } catch (error) {
      console.error(error);
      return linkingFailed(branding);
    }

    if (!idpLink) {
      return linkingFailed(branding);
    } else {
      return linkingSuccess(userId, { idpIntentId: id, idpIntentToken: token }, requestId, branding);
    }
  }

  // If we reach here, no existing user was found and we don't allow creation
  // Show user not found message
  return (
    <DynamicTheme branding={branding}>
      <div className="flex flex-col items-center space-y-4">
        <h1>
          <Translated i18nKey="userNotFound.title" namespace="idp" />
        </h1>
        <p className="ztdl-p">
          <Translated i18nKey="userNotFound.description" namespace="idp" />
        </p>
        <div className="mt-4">
          <a
            href="/loginname"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Translated i18nKey="userNotFound.backToLogin" namespace="idp" />
          </a>
        </div>
      </div>
    </DynamicTheme>
  );
}
