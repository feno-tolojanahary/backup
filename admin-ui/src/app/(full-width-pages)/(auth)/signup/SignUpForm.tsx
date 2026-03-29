"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useToast } from "@/context/ToastContext";
import { CreateUserPayload } from "@/handlers/users/type";
import { insertUser } from "@/handlers/users/userService";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { signupSchema, type SignupFormValues } from "@/validation/auth/signupSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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

  const router = useRouter();

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
      router.push("/signin");
      reset();
    } catch (error: any) {
      console.error("Save user informations: ", error.message);
      toastError();
    }
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10 no-scrollbar">
      <div className="w-full max-w-md">

        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90 sm:text-title-md">
              Create your backup workspace
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Get started with secure, automated SaaS backups in minutes.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-5">
              <div className="flex flex-col gap-5">
                <div>
                  <Label htmlFor="fullName">
                    Full name<span className="text-error-500">*</span>
                  </Label>
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
                <div>
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
        </div>
      </div>
    </div>
  );
}
