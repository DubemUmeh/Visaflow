import { InfoPage } from "@/components/content/info-page";

export default function Page() {
  return (
    <InfoPage
      eyebrow={"Refund policy"}
      title={"Refund Policy"}
      description={
        "This policy explains how VisaFlow reviews refund requests for service fees, failed payments, duplicate charges, and government fees."
      }
      sections={[
        {
          title: "Failed payments",
          body: "Failed checkout attempts should not submit applications or create completed payment records.",
        },
        {
          title: "Duplicate charges",
          body: "Contact support immediately with receipts so the payments team can investigate and reverse eligible duplicates.",
        },
        {
          title: "Government fees",
          body: "Government fees are often non-refundable once an application is transmitted to an authority.",
        },
        {
          title: "How to request",
          body: "Submit a support ticket with your application reference, payment receipt, and reason for the refund request.",
        },
      ]}
    />
  );
}
