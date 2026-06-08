import { InfoPage } from "@/components/content/info-page";

export default function ProcessingTiersPost() {
  return (
    <InfoPage
      eyebrow="VisaFlow Blog"
      title="Standard, expedited, or rush processing"
      description="Choose a processing tier based on your travel date, document readiness, and budget."
      sections={[
        {
          title: "Standard",
          body: "Best for flexible travel dates and applicants who want the lowest service cost.",
        },
        {
          title: "Expedited",
          body: "Useful when travel is approaching and documents are already complete.",
        },
        {
          title: "Rush",
          body: "Reserved for urgent travel where the destination and visa type support faster handling.",
        },
        {
          title: "Plan realistically",
          body: "Processing speed does not guarantee approval and may still depend on third-party or government review.",
        },
      ]}
    />
  );
}
