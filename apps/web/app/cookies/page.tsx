import { InfoPage } from "@/components/content/info-page";

export default function Page() {
  return (
    <InfoPage
      eyebrow={"Cookie policy"}
      title={"Cookie Policy"}
      description={
        "VisaFlow uses cookies and similar technologies to keep sessions secure, remember preferences, and understand service performance."
      }
      sections={[
        {
          title: "Essential cookies",
          body: "Required cookies support login, authentication, security, and application workflow continuity.",
        },
        {
          title: "Analytics cookies",
          body: "Analytics helps us understand page performance and improve confusing steps.",
        },
        {
          title: "Preference cookies",
          body: "Preferences can remember language, region, and interface choices.",
        },
        {
          title: "Managing cookies",
          body: "You can control browser cookie settings, but disabling essential cookies may break account features.",
        },
      ]}
    />
  );
}
