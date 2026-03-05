import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Access the backup administration panel.",
};

export default function SignIn() {
  return <SignInForm />;
}
