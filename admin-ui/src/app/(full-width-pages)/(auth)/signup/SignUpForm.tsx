"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useToast } from "@/context/ToastContext";
import { CreateUserPayload } from "@/handlers/users/type";
import { insertUser } from "@/handlers/users/userService";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { signupSchema, type SignupFormValues } from "@/validation/auth/signupSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

type Strength = {
  score: number;
  label: string;
  barClass: string;
};

const getPasswordStrength = (password: string): Strength => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!password) {
    return { score: 0, label: "Enter a password", barClass: "bg-gray-200" };
  }

  if (score <= 1) {
    return { score, label: "Weak", barClass: "bg-error-500" };
  }
  if (score === 2) {
    return { score, label: "Fair", barClass: "bg-amber-500" };
  }
  if (score === 3) {
    return { score, label: "Good", barClass: "bg-blue-500" };
  }
  return { score, label: "Strong", barClass: "bg-success-500" };
};

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { toastSuccess, toastError } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      companyName: "",
    },
    mode: "onBlur",
  });

  const passwordValue = watch("password");
  const strength = useMemo(
    () => getPasswordStrength(passwordValue),
    [passwordValue]
  );

  const onSubmit = async (data: SignupFormValues) => {
    try {
      const userData: CreateUserPayload = data;
      const res = await insertUser(userData);
      if (!res) {
        throw new Error("Error save data.")
      }
      toastSuccess("Save user information with success.");
      reset();
    } catch (error: any) {
      console.error("Save user informations: ", error.message);
      toastError();
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto no-scrollbar lg:w-1/2">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90 sm:text-title-md">
              Create your backup workspace
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Get started with secure, automated SaaS backups in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
            <button className="inline-flex items-center justify-center gap-3 rounded-lg bg-gray-100 px-7 py-3 text-sm font-normal text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
                  fill="#4285F4"
                />
                <path
                  d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
                  fill="#34A853"
                />
                <path
                  d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
                  fill="#FBBC05"
                />
                <path
                  d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
                  fill="#EB4335"
                />
              </svg>
              Continue with Google
            </button>
            <button className="inline-flex items-center justify-center gap-3 rounded-lg bg-gray-100 px-7 py-3 text-sm font-normal text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
              <svg
                width="21"
                className="fill-current"
                height="20"
                viewBox="0 0 21 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M15.6705 1.875H18.4272L12.4047 8.75833L19.4897 18.125H13.9422L9.59717 12.4442L4.62554 18.125H1.86721L8.30887 10.7625L1.51221 1.875H7.20054L11.128 7.0675L15.6705 1.875ZM14.703 16.475H16.2305L6.37054 3.43833H4.73137L14.703 16.475Z" />
              </svg>
              Continue with X
            </button>
          </div>

          <div className="relative py-3 sm:py-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white p-2 text-gray-400 dark:bg-gray-900 sm:px-5 sm:py-2">
                Or
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    type="text"
                    id="fullName"
                    placeholder="Jane Doe"
                    autoComplete="name"
                    {...register("fullName")}
                    error={!!errors.fullName}
                    aria-invalid={!!errors.fullName}
                    aria-describedby={
                      errors.fullName ? "fullName-error" : undefined
                    }
                  />
                  {errors.fullName ? (
                    <p id="fullName-error" className="mt-1 text-xs text-error-600">
                      {errors.fullName.message}
                    </p>
                  ) : null}
                </div>
                <div className="sm:col-span-1">
                  <Label htmlFor="companyName">Company name</Label>
                  <Input
                    type="text"
                    id="companyName"
                    placeholder="Northwind Labs"
                    autoComplete="organization"
                    {...register("companyName")}
                    error={!!errors.companyName}
                    aria-invalid={!!errors.companyName}
                    aria-describedby={
                      errors.companyName ? "companyName-error" : undefined
                    }
                  />
                  {errors.companyName ? (
                    <p
                      id="companyName-error"
                      className="mt-1 text-xs text-error-600"
                    >
                      {errors.companyName.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <Label htmlFor="email">
                  Email<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  id="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  {...register("email")}
                  error={!!errors.email}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email ? (
                  <p id="email-error" className="mt-1 text-xs text-error-600">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="password">
                  Password<span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    placeholder="Create a strong password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...register("password")}
                    error={!!errors.password}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : "password-strength"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 z-30 -translate-y-1/2 text-gray-500"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </button>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span id="password-strength">Password strength</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {strength.label}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {Array.from({ length: 4 }).map((_, index) => {
                      const active = index < strength.score;
                      return (
                        <span
                          key={`strength-${index}`}
                          className={`h-1.5 flex-1 rounded-full ${
                            active ? strength.barClass : "bg-gray-200 dark:bg-gray-800"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
                {errors.password ? (
                  <p id="password-error" className="mt-2 text-xs text-error-600">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="confirmPassword">
                  Confirm password<span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    placeholder="Re-enter your password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                    error={!!errors.confirmPassword}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={
                      errors.confirmPassword ? "confirmPassword-error" : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 z-30 -translate-y-1/2 text-gray-500"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword ? (
                  <p
                    id="confirmPassword-error"
                    className="mt-1 text-xs text-error-600"
                  >
                    {errors.confirmPassword.message}
                  </p>
                ) : null}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Creating account..." : "Create account"}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-center text-sm font-normal text-gray-700 dark:text-gray-400 sm:text-start">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
