import { InfoPage } from "@/components/content/info-page";

export default function Page() {
  return (
    <InfoPage
      eyebrow={"Press"}
      title={"VisaFlow press room"}
      description={
        "Company information, media resources, and contact guidance for journalists and partners covering travel technology."
      }
      sections={[
        {
          title: "About VisaFlow",
          body: "VisaFlow is a digital visa workflow platform focused on clarity, speed, and applicant confidence.",
        },
        {
          title: "Media inquiries",
          body: "Send press questions through the contact page and include your publication, deadline, and topic.",
        },
        {
          title: "Brand assets",
          body: "Use official VisaFlow names and screenshots only in accurate context.",
        },
        {
          title: "Company updates",
          body: "Major product and policy updates are published through official VisaFlow channels.",
        },
      ]}
    />
  );
}
