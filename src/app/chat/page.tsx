import { PageHeader } from "@/components/shared/page-header";

export default function ChatPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="AI Premed Advisor"
        description="Ask anything about your application strategy — powered by Claude with your profile and school data as context."
      />
      {/* TODO: Chat interface with message history and RAG-powered responses */}
    </div>
  );
}
