import { InfoPage } from "@/components/content/info-page";

export default function CleanPassportScanPost() {
  return (
    <InfoPage
      eyebrow="VisaFlow Blog"
      title="How to prepare a clean passport scan"
      description="A clean passport scan reduces review delays and helps staff confirm identity details quickly."
      sections={[
        {
          title: "Use good lighting",
          body: "Place the passport on a flat surface, avoid glare, and make sure all four corners of the identity page are visible.",
        },
        {
          title: "Keep text readable",
          body: "Names, passport number, birth date, expiry date, and machine-readable lines must be sharp and unobstructed.",
        },
        {
          title: "Upload the right file",
          body: "Use a high-quality JPG, PNG, or PDF and avoid screenshots that blur security features.",
        },
        {
          title: "Check before submitting",
          body: "Compare every form field against the passport so spelling and dates match exactly.",
        },
      ]}
    />
  );
}
