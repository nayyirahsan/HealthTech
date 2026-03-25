import { PageHeader } from "@/components/shared/page-header";

export default function LoginPage() {
  return (
    <div className="p-8 max-w-md mx-auto">
      <PageHeader
        title="Sign In"
        description="Sign in or create an account with Google or email to access your personalized premed dashboard."
      />
      {/* TODO: Supabase Auth UI */}
    </div>
  );
}
