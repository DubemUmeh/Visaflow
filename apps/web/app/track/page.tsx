import { InfoPage } from "@/components/content/info-page";

export default function Page() {
  return (
    <InfoPage
      eyebrow={"Track application"}
      title={"Track your visa application"}
      description={
        "Use your VisaFlow dashboard and reference number to monitor review progress, required actions, and final decisions."
      }
      sections={[
        {
          title: "Reference numbers",
          body: "Every application receives a VisaFlow reference for support and status lookup.",
        },
        {
          title: "Status updates",
          body: "Draft, submitted, under review, missing documents, approved, rejected, and completed statuses explain what happens next.",
        },
        {
          title: "Notifications",
          body: "Dashboard notifications highlight actions needed and important account events.",
        },
        {
          title: "Support escalation",
          body: "If a deadline is close, contact support with your reference number and travel date.",
        },
      ]}
    />
  );
}
