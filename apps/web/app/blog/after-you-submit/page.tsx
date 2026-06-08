import { InfoPage } from "@/components/content/info-page";

export default function AfterYouSubmitPost() {
  return (
    <InfoPage
      eyebrow="VisaFlow Blog"
      title="What happens after you submit"
      description="After successful payment, your application moves from draft into the review workflow."
      sections={[
        {
          title: "Initial checks",
          body: "VisaFlow checks completeness, document readability, travel dates, and payment status.",
        },
        {
          title: "Review updates",
          body: "You may see under review, missing documents, approved, rejected, or completed status changes.",
        },
        {
          title: "Notifications",
          body: "Important requests and decisions appear in your dashboard notifications and support history.",
        },
        {
          title: "Keep records",
          body: "Save receipts, reference numbers, and final visa documents for travel and support.",
        },
      ]}
    />
  );
}
