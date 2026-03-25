import { PageHeader } from "@/components/shared/page-header";

export default function OnboardingPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Welcome! Let's Build Your Profile"
        description="Multi-step form to collect your GPA, MCAT, activities, demographics, and target schools."
      />
      {/* TODO: Multi-step onboarding wizard */}
    </div>
  );
}
