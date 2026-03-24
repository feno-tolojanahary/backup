"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/context/ToastContext";
import { login } from "@/store/features/auth/authThunk";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

type SignInFormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export default function SignInForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const [errorMessage, setErrorMessage] = useState("");
  const [loginError, setLoginError] = useState("");
  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<SignInFormValues>({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const { toastError, toastSuccess } = useToast();

  const onSubmit = async (data: SignInFormValues) => {
    setErrorMessage("");
    setLoginError("");

    const trimmedEmail = data.email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setErrorMessage("Invalid email format.");
      return;
    }

    try {
      const result = await dispatch(login(data))
      if (login.fulfilled.match(result)) {
        router.push("/");
      } else {
        throw new Error("Login not success.");
      }
    } catch (error: any) {
      console.error("Login validation error: ", error.message);
      setLoginError("Email or password is not valid.");
    }

  };

  return (
    <div className="flex w-full flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-8 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:px-8">
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white/90">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Access the backup administration panel.
            </p>
          </div>

          {errorMessage ? (
            <div className="mb-5 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-200">
              {errorMessage}
            </div>
          ) : null}

          {loginError ? (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
              {loginError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <div>
                <Label>Email address</Label>
                <Input
                  placeholder="admin@mail.com"
                  type="email"
                  {...register("email")}
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  {...register("password")}
                />
              </div>
              <div className="flex items-center gap-3">
                <Controller
                  name="rememberMe"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Remember me
                </span>
              </div>
              <Button className="w-full" size="sm" isLoading={isLoading} disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
