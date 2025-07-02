import AuthLayout from "@/components/auth-layout";
import SignupForm from "@/components/signup-form";

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create an Account"
      description="Get started with Norruva for free."
      footerText="Already have an account?"
      footerLinkText="Log in"
      footerLinkHref="/login"
    >
      <SignupForm />
    </AuthLayout>
  );
}
