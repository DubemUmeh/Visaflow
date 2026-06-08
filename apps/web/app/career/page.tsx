import { InfoPage } from "@/components/content/info-page";

export default function Page() {
  return (
    <InfoPage
      eyebrow={"Careers"}
      title={"Build trusted travel infrastructure"}
      description={
        "Join VisaFlow to create clearer, faster, and safer visa experiences for travelers, families, and global teams."
      }
      sections={[
        {
          title: "Customer trust",
          body: "We hire people who care about accuracy, empathy, and responsible handling of sensitive travel data.",
        },
        {
          title: "Open roles",
          body: "Product, operations, engineering, compliance, and customer success roles are posted as teams grow.",
        },
        {
          title: "How we work",
          body: "We value clear writing, measurable ownership, and respectful collaboration across time zones.",
        },
        {
          title: "Candidate experience",
          body: "Applicants receive transparent timelines, structured interviews, and feedback whenever possible.",
        },
      ]}
    />
  );
}
