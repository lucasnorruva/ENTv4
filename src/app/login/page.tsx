import AuthLayout from "@/components/auth-layout";
import LoginForm from "@/components/login-form";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome Back"
      description="Enter your credentials to access your account."
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkHref="/signup"
    >
      <LoginForm />
    </AuthLayout>
  );
}
