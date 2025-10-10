"use client";

import { resetPassword, sendPassword } from "@/lib/server/password";
import { create } from "@zitadel/client";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Alert, AlertType } from "./alert";
import { Button, ButtonVariants, ButtonColors } from "./button";
import { TextInput } from "./input";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

type Inputs = {
  password: string;
};

type Props = {
  loginSettings: LoginSettings | undefined;
  loginName: string;
  organization?: string;
  requestId?: string;
};

export function PasswordForm({ loginSettings, loginName, organization, requestId }: Props) {
  const { register, handleSubmit, formState } = useForm<Inputs>({
    mode: "onBlur",
  });

  const t = useTranslations("password");

  const [info, setInfo] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  async function submitPassword(values: Inputs) {
    setError("");
    setLoading(true);

    const response = await sendPassword({
      loginName,
      organization,
      checks: create(ChecksSchema, {
        password: { password: values.password },
      }),
      requestId,
    })
      .catch(() => {
        setError("Could not verify password");
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (response && "error" in response && response.error) {
      setError(response.error);
      return;
    }

    if (response && "redirect" in response && response.redirect) {
      return router.push(response.redirect);
    }
  }

  async function resetPasswordAndContinue() {
    setError("");
    setInfo("");
    setLoading(true);

    const response = await resetPassword({
      loginName,
      organization,
      requestId,
    })
      .catch(() => {
        setError("Could not reset password");
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (response && "error" in response) {
      setError(response.error);
      return;
    }

    setInfo("Password was reset. Please check your email.");

    const params = new URLSearchParams({
      loginName: loginName,
    });

    if (organization) {
      params.append("organization", organization);
    }

    if (requestId) {
      params.append("requestId", requestId);
    }

    return router.push("/password/set?" + params);
  }

  return (
    <form className="w-full">
      <div className={`${error && "transform-gpu animate-shake"}`}>
        <TextInput
          type="password"
          autoComplete="password"
          {...register("password", { required: t("verify.required.password") })}
          label={t("verify.labels.password")}
          data-testid="password-text-input"
        />
        {!loginSettings?.hidePasswordReset && (
          <div className="mt-2 flex w-full justify-end">
            <button
              className="text-sm text-gray-600 transition-colors hover:text-warn-light-500 dark:text-gray-300 dark:hover:text-warn-dark-500"
              onClick={() => resetPasswordAndContinue()}
              type="button"
              disabled={loading}
              data-testid="reset-button"
            >
              <Translated i18nKey="verify.resetPassword" namespace="password" />
            </button>
          </div>
        )}

        {loginName && <input type="hidden" name="loginName" autoComplete="username" value={loginName} />}
      </div>

      {info && (
        <div className="py-4">
          <Alert type={AlertType.INFO}>{info}</Alert>
        </div>
      )}

      {error && (
        <div className="py-4" data-testid="error">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="mt-8 w-full">
        <Button
          type="submit"
          className="h-12 w-full justify-center"
          variant={ButtonVariants.Primary}
          color={ButtonColors.Warn}
          disabled={loading || !formState.isValid}
          onClick={handleSubmit(submitPassword)}
          data-testid="submit-button"
        >
          {loading && <Spinner className="mr-2 h-5 w-5" />} <Translated i18nKey="verify.submit" namespace="password" />
        </Button>
      </div>
    </form>
  );
}
