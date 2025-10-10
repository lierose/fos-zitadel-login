"use client";

import { idpTypeToSlug } from "@/lib/idp";
import { redirectToIdp } from "@/lib/server/idp";
import {
  IdentityProvider,
  IdentityProviderType,
} from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { ReactNode, useActionState } from "react";
import { Alert } from "./alert";
import { SignInWithIdentityProviderProps } from "./idps/base-button";
import { SignInWithApple } from "./idps/sign-in-with-apple";
import { SignInWithAzureAd } from "./idps/sign-in-with-azure-ad";
import { SignInWithGeneric } from "./idps/sign-in-with-generic";
import { SignInWithGithub } from "./idps/sign-in-with-github";
import { SignInWithGitlab } from "./idps/sign-in-with-gitlab";
import { SignInWithGoogle } from "./idps/sign-in-with-google";
import { Translated } from "./translated";

export interface SignInWithIDPProps {
  children?: ReactNode;
  identityProviders: IdentityProvider[];
  requestId?: string;
  organization?: string;
  linkOnly?: boolean;
  filterTypes?: IdentityProviderType[];
  layout?: "column" | "row";
}

export function SignInWithIdp({
  identityProviders,
  requestId,
  organization,
  linkOnly,
  filterTypes,
  layout = "column",
}: Readonly<SignInWithIDPProps>) {
  const [state, action, _isPending] = useActionState(redirectToIdp, {});

  const renderIDPButton = (idp: IdentityProvider, index: number) => {
    const { id, name, type } = idp;

    const components: Partial<Record<IdentityProviderType, (props: SignInWithIdentityProviderProps) => ReactNode>> = {
      [IdentityProviderType.APPLE]: SignInWithApple,
      [IdentityProviderType.OAUTH]: SignInWithGeneric,
      [IdentityProviderType.OIDC]: SignInWithGeneric,
      [IdentityProviderType.GITHUB]: SignInWithGithub,
      [IdentityProviderType.GITHUB_ES]: SignInWithGithub,
      [IdentityProviderType.AZURE_AD]: SignInWithAzureAd,
      [IdentityProviderType.GOOGLE]: (props) => <SignInWithGoogle {...props} e2e="google" />,
      [IdentityProviderType.GITLAB]: SignInWithGitlab,
      [IdentityProviderType.GITLAB_SELF_HOSTED]: SignInWithGitlab,
      [IdentityProviderType.SAML]: SignInWithGeneric,
      [IdentityProviderType.LDAP]: SignInWithGeneric,
      [IdentityProviderType.JWT]: SignInWithGeneric,
    };

    const Component = components[type];
    return Component ? (
      <form action={action} className="flex w-full md:flex-1" key={`idp-${index}`}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="provider" value={idpTypeToSlug(type)} />
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="organization" value={organization} />
        <input type="hidden" name="linkOnly" value={linkOnly ? "true" : "false"} />
        <Component key={id} name={name} />
      </form>
    ) : null;
  };

  const filtered =
    filterTypes && filterTypes.length ? identityProviders?.filter((p) => filterTypes.includes(p.type)) : identityProviders;

  return (
    <div className="flex w-full flex-col space-y-2 text-sm">
      <div className="flex w-full items-center gap-3 mb-5">
        <div className="h-px w-full flex-1 bg-gray-300 dark:bg-gray-700"></div>
        <span className="px-2 text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300">
          <Translated i18nKey="or" namespace="common" />
        </span>
        <div className="h-px w-full flex-1 bg-gray-300 dark:bg-gray-700"></div>
      </div>
      <div className={layout === "row" ? "flex w-full flex-row items-center gap-3" : "flex w-full flex-col space-y-2"}>
        {!!filtered?.length && filtered?.map(renderIDPButton)}
      </div>
      {state?.error && (
        <div className="py-4">
          <Alert>{state?.error}</Alert>
        </div>
      )}
    </div>
  );
}

SignInWithIdp.displayName = "SignInWithIDP";
