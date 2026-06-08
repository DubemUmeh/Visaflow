import { InfoPage } from "@/components/content/info-page";

export default function Page() {
  return (
    <InfoPage
      eyebrow={"FAQ"}
      title={"Frequently Asked Questions"}
      description={
        "Clear answers to common VisaFlow questions about eligibility, accounts, applications, payments, and status updates."
      }
      sections={[
        {
          title: "Can I check eligibility without signing up?",
          body: "Yes. Eligibility checks should show initial guidance before account registration is required for saving or submitting an application.",
        },
        {
          title: "Why verify email?",
          body: "Email verification protects applicants and ensures important requests and decisions reach the right person.",
        },
        {
          title: "What happens if payment fails?",
          body: "Your application remains a draft and can be retried without marking it as submitted.",
        },
        {
          title: "How do admins review cases?",
          body: "Authorized admins can review submitted applications, support history, and analytics from the admin dashboard.",
        },
      ]}
    />
  );
}
