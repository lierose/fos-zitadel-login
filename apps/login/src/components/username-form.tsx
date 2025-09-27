"use client";

import { sendLoginname } from "@/lib/server/loginname";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "./alert";
import { BackButton } from "./back-button";
import { Button, ButtonVariants } from "./button";
import { TextInput } from "./input";
import { Spinner } from "./spinner";
import { Translated } from "./translated";
import { useTranslations } from "next-intl";

type Inputs = {
  loginName: string;
};

type Props = {
  loginName: string | undefined;
  requestId: string | undefined;
  loginSettings: LoginSettings | undefined;
  organization?: string;
  suffix?: string;
  submit: boolean;
  allowRegister: boolean;
};

export function UsernameForm({
  loginName,
  requestId,
  organization,
  suffix,
  loginSettings,
  submit,
  allowRegister,
}: Props) {
  const { register, handleSubmit, formState } = useForm<Inputs>({
    mode: "onBlur",
    defaultValues: {
      loginName: loginName ? loginName : "",
    },
  });

  const t = useTranslations("loginname");

  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  async function submitLoginName(values: Inputs, organization?: string) {
    setLoading(true);

    const res = await sendLoginname({
      loginName: values.loginName,
      organization,
      requestId,
      suffix,
    })
      .catch(() => {
        setError("An internal error occurred");
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (res && "redirect" in res && res.redirect) {
      return router.push(res.redirect);
    }

    if (res && "error" in res && res.error) {
      setError(res.error);
      return;
    }

    return res;
  }

  useEffect(() => {
    if (submit && loginName) {
      // When we navigate to this page, we always want to be redirected if submit is true and the parameters are valid.
      submitLoginName({ loginName }, organization);
    }
  }, []);

  let inputLabel = t("labels.loginname");
  if (
    loginSettings?.disableLoginWithEmail &&
    loginSettings?.disableLoginWithPhone
  ) {
    inputLabel = t("labels.username");
  } else if (loginSettings?.disableLoginWithEmail) {
    inputLabel = t("labels.usernameOrPhoneNumber");
  } else if (loginSettings?.disableLoginWithPhone) {
    inputLabel = t("labels.usernameOrEmail");
  }

  return (
    <form className="w-full space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="text"
          autoComplete="username"
          placeholder="your@email.com"
          {...register("loginName", { required: t("required.loginName") })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          data-testid="username-text-input"
        />
        {suffix && <span className="text-sm text-gray-500">@{suffix}</span>}
      </div>

      <button
        type="submit"
        onClick={handleSubmit((e) => submitLoginName(e, organization))}
        disabled={loading || !formState.isValid}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        data-testid="submit-button"
      >
        {loading && <Spinner className="mr-2 h-5 w-5" />}
        Login
      </button>

      {error && (
        <div className="py-4" data-testid="error">
          <Alert>{error}</Alert>
        </div>
      )}

      {allowRegister && (
        <div className="text-center">
          <button
            className="text-sm text-gray-600 hover:text-green-600 transition-colors"
            onClick={() => {
              const registerParams = new URLSearchParams();
              if (organization) {
                registerParams.append("organization", organization);
              }
              if (requestId) {
                registerParams.append("requestId", requestId);
              }
              router.push("/register?" + registerParams);
            }}
            type="button"
            disabled={loading}
            data-testid="register-button"
          >
            <Translated i18nKey="register" namespace="loginname" />
          </button>
        </div>
      )}
    </form>
  );
}
