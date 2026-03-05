"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  role: "Owner" | "Admin" | "Operator" | "Read-only";
  active: boolean;
};

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const users = useMemo<UserRecord[]>(
    () => [
      {
        id: "user-admin",
        email: "admin@mail.com",
        passwordHash:
          "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",
        role: "Admin",
        active: true,
      },
      {
        id: "user-disabled",
        email: "disabled@mail.com",
        passwordHash:
          "dde79399fb85ad1dfbaec103d360520c2590f9106832d830dff673eae18c39d9",
        role: "Read-only",
        active: false,
      },
    ],
    []
  );

  const hashPassword = async (value: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setErrorMessage("Invalid email format.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = users.find((item) => item.email === trimmedEmail);
      if (!user) {
        setErrorMessage("Invalid email or password.");
        return;
      }

      const passwordHash = await hashPassword(password);
      if (passwordHash !== user.passwordHash) {
        setErrorMessage("Invalid email or password.");
        return;
      }

      if (!user.active) {
        setErrorMessage("Account disabled.");
        return;
      }

      const now = Date.now();
      const session = {
        userId: user.id,
        email: user.email,
        role: user.role,
        loginAt: new Date(now).toISOString(),
        expiresAt: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      };
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("backup_admin_session", JSON.stringify(session));
      router.push("/");
    } finally {
      setIsSubmitting(false);
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

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <Label>Email address</Label>
                <Input
                  placeholder="admin@mail.com"
                  type="email"
                  defaultValue={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  defaultValue={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Checkbox checked={rememberMe} onChange={setRememberMe} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Remember me
                </span>
              </div>
              <Button className="w-full" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
