import { SignUp } from "@clerk/nextjs";
import { AuthLayout } from "@/components/app/auth-layout";

export default function SignUpPage() {
  return (
    <AuthLayout>
      <SignUp />
    </AuthLayout>
  );
}
