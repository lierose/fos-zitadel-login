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
import { BackButton } from "./back-button";
import { Button, ButtonVariants } from "./button";
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

export function PasswordForm({
  loginSettings,
  loginName,
  organization,
  requestId,
}: Props) {
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
    <form className="w-full space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          autoComplete="password"
          placeholder="Enter your password"
          {...register("password", { required: t("verify.required.password") })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          data-testid="password-text-input"
        />
        {loginName && <input type="hidden" name="loginName" autoComplete="username" value={loginName} />}
      </div>

      <button
        type="submit"
        onClick={handleSubmit(submitPassword)}
        disabled={loading || !formState.isValid}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        data-testid="submit-button"
      >
        {loading && <Spinner className="mr-2 h-5 w-5" />}
        Continue
      </button>

      {!loginSettings?.hidePasswordReset && (
        <div className="text-center">
          <button
            className="text-sm text-gray-600 hover:text-green-600 transition-colors"
            onClick={() => resetPasswordAndContinue()}
            type="button"
            disabled={loading}
            data-testid="reset-button"
          >
            <Translated i18nKey="verify.resetPassword" namespace="password" />
          </button>
        </div>
      )}

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
    </form>
  );
}
