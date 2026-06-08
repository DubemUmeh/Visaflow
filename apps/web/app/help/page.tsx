import { InfoPage } from "@/components/content/info-page";

export default function Page() {
  return (
    <InfoPage
      eyebrow={"Help center"}
      title={"Answers from VisaFlow support"}
      description={
        "Find practical guidance for eligibility checks, applications, documents, payments, account access, and status tracking."
      }
      sections={[
        {
          title: "Starting an application",
          body: "Check eligibility, create an account, verify your email, and complete each required application step.",
        },
        {
          title: "Documents",
          body: "Upload clear scans, confirm names match your passport, and respond quickly if additional documents are requested.",
        },
        {
          title: "Payments",
          body: "VisaFlow uses secure checkout providers. Failed checkout attempts keep applications in draft until payment succeeds.",
        },
        {
          title: "Support",
          body: "Open a support ticket from your dashboard for account-specific help and status updates.",
        },
      ]}
    />
  );
}
