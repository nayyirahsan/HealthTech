import { PageHeader } from "@/components/shared/page-header";

export default function InterviewPrepPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Interview Prep"
        description="AI mock interview practice — MMI, traditional, and school-specific questions powered by SDN data."
      />
      {/* TODO: School selector + AI interview simulation */}
    </div>
  );
}
