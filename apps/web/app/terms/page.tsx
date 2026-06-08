import { InfoPage } from "@/components/content/info-page";

export default function Page() {
  return (
    <InfoPage
      eyebrow={"Terms"}
      title={"Terms of Service"}
      description={
        "These terms explain responsible use of VisaFlow, account obligations, payment expectations, and service limitations."
      }
      sections={[
        {
          title: "Use of service",
          body: "Provide accurate information and only submit applications you are authorized to manage.",
        },
        {
          title: "No government guarantee",
          body: "VisaFlow helps prepare and route applications but does not guarantee approval by any authority.",
        },
        {
          title: "Payments and fees",
          body: "Fees are disclosed before checkout. Government and service fees can have different refund rules.",
        },
        {
          title: "Account security",
          body: "Keep credentials secure and notify support if you suspect unauthorized access.",
        },
      ]}
    />
  );
}
