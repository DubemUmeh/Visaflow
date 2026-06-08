import { InfoPage } from "@/components/content/info-page";

export default function Page() {
  return (
    <InfoPage
      eyebrow={"Privacy policy"}
      title={"Privacy Policy"}
      description={
        "VisaFlow protects personal information used for eligibility checks, account services, visa applications, support, and payment coordination."
      }
      sections={[
        {
          title: "Information we collect",
          body: "We collect account details, application data, documents you upload, device data, and support communications.",
        },
        {
          title: "How we use data",
          body: "Data is used to provide services, verify identity, process applications, prevent fraud, and improve reliability.",
        },
        {
          title: "Sharing",
          body: "We only share information with service providers, payment processors, authorities, or partners when required to deliver the service or comply with law.",
        },
        {
          title: "Your choices",
          body: "You can update profile details, request support, and ask about access, correction, or deletion where applicable.",
        },
      ]}
    />
  );
}
