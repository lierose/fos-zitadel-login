"use client";

import { resetPassword, sendPassword } from "@/lib/server/password";
import { create } from "@zitadel/client";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Button, ButtonVariants } from "./button";
import { TextInput } from "./input";
import { Notification, useNotification } from "./notification";
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

  const [loading, setLoading] = useState<boolean>(false);
  const { notifications, addNotification, removeNotification } = useNotification();

  const router = useRouter();

  async function submitPassword(values: Inputs) {
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
        addNotification("Could not verify password", "error");
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (response && "error" in response && response.error) {
      addNotification(response.error, "error");
      return;
    }

    if (response && "redirect" in response && response.redirect) {
      return router.push(response.redirect);
    }
  }

  async function resetPasswordAndContinue() {
    setLoading(true);

    try {
      const response = await resetPassword({
        loginName,
        organization,
        requestId,
      });

      if (response && "error" in response) {
        addNotification(response.error, "error");
        return;
      }

      addNotification("Password reset link sent. Please check your email.", "success");

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
    } catch (error) {
      console.error("Reset password error:", error);
      addNotification("Could not reset password. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="w-full space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
        <input
          type="password"
          autoComplete="password"
          placeholder="Enter your password"
          {...register("password", { required: t("verify.required.password") })}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-0.5 focus:ring-[#559775] focus:border-[#559775] transition-colors text-gray-900 dark:text-white"
          data-testid="password-text-input"
        />
        {loginName && <input type="hidden" name="loginName" autoComplete="username" value={loginName} />}

        {/* Forgot password link */}
        {!loginSettings?.hidePasswordReset && (
          <div className="text-right">
            <button
              className="text-sm text-gray-600 dark:text-gray-300 transition-colors hover:text-[#559775] "
              onClick={() => resetPasswordAndContinue()}
              type="button"
              disabled={loading}
              data-testid="reset-button"
            >
              Forgot password?
            </button>
          </div>
        )}
      </div>

      <button
        type="submit"
        onClick={handleSubmit(submitPassword)}
        disabled={loading || !formState.isValid}
        className="w-full text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center hover:bg-[#559775]"
        style={{ backgroundColor: "#559775" }}
        data-testid="submit-button"
      >
        {loading && <Spinner className="mr-2 h-5 w-5" />}
        Continue
      </button>

      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </form>
  );
}
