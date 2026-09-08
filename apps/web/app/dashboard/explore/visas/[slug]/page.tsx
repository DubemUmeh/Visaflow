import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  Mail,
  Phone,
  Star,
  FileText,
  CreditCard,
  Timer,
  Globe2,
  BadgeCheck,
  Plane,
  UploadCloud,
  Send,
  PackageCheck,
  Lock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/lib/api";
import type { VisaTypeEntity } from "@visaflow/shared-types";

async function getVisaType(slug: string): Promise<VisaTypeEntity | null> {
  try {
    const res = await api.get(`/visa-types/${slug}`);
    return res.data?.data ?? res.data;
  } catch {
    return null;
  }
}

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

const SUPPORT_OPTIONS = [
  { label: "Live chat", icon: MessageCircle, meta: "Replies in ~2 min" },
  { label: "Email support", icon: Mail, meta: "Replies within 24h" },
  { label: "Call support", icon: Phone, meta: "Mon–Sat, 9am–7pm" },
];

const CATEGORY_LABELS: Record<string, string> = {
  TOURISM: "Tourism Visa",
  BUSINESS: "Business Visa",
  STUDY: "Student Visa",
  WORK: "Work Visa",
  TRANSIT: "Transit Visa",
  OTHER: "Visa",
};

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "requirements", label: "Requirements" },
  { value: "fees", label: "Fees" },
  { value: "processing", label: "Processing" },
  { value: "documents", label: "Documents" },
  { value: "faqs", label: "FAQs" },
];

export default async function VisaDetailsPage(props: PageProps) {
  const resolvedParams = await Promise.resolve(props.params);
  const visa = await getVisaType(resolvedParams?.slug);

  if (!visa) {
    notFound();
  }

  const countryName = visa.destinationCountry?.name || "your destination";
  const flag = visa.destinationCountry?.flagEmoji || "🌍";
  const categoryLabel = CATEGORY_LABELS[visa.category as string] || visa.name;

  const stats = [
    {
      label: "Processing",
      value: `${visa.processingDaysMin}–${visa.processingDaysMax} days`,
      icon: Timer,
      className: "",
    },
    {
      label: "Validity",
      value: visa.validityPeriod ?? "Variable",
      icon: Clock,
      className: "",
    },
    {
      label: "Entry",
      value: visa.entryType,
      icon: Globe2,
      className: "capitalize",
    },
    {
      label: "Stay",
      value: visa.stayDuration ? `Up to ${visa.stayDuration} days` : "Variable",
      icon: Plane,
      className: "",
    },
  ] as const;

  const highlights = [
    {
      title: `Explore ${countryName}`,
      desc: "Experience the culture and landmarks",
    },
    { title: "Tourism & leisure", desc: "Perfect for holidays and visits" },
    {
      title: "Easy application",
      desc: "Simple online process, clear requirements",
    },
    { title: "Secure processing", desc: "Bank-level encryption for your data" },
  ];

  const requirementGroups = [
    {
      title: "Identity & travel",
      items: [
        "Passport valid for at least 6 months beyond your stay",
        "Recent passport-style photo, white background",
        "Confirmed round-trip flight itinerary",
      ],
    },
    {
      title: "Financial & accommodation",
      items: [
        "Proof of sufficient funds for your stay",
        "Hotel booking or accommodation letter",
        "Travel or health insurance covering your trip",
      ],
    },
  ];

  const documents = [
    { name: "Passport bio page", format: "PDF or JPG, under 5MB" },
    { name: "Passport photo", format: "JPG, 2x2 in, white background" },
    { name: "Proof of funds", format: "Bank statement, last 3 months" },
    { name: "Travel itinerary", format: "PDF, round-trip booking" },
    { name: "Accommodation proof", format: "PDF, hotel or invitation letter" },
  ];

  const processSteps = [
    {
      title: "Apply online",
      desc: "Fill out the application form with your travel and personal details.",
      icon: FileText,
    },
    {
      title: "Upload documents",
      desc: "Attach the required documents. We check formatting before you submit.",
      icon: UploadCloud,
    },
    {
      title: "Pay & submit",
      desc: "Pay securely online and your application is sent for review.",
      icon: CreditCard,
    },
    {
      title: "Track & receive",
      desc: "Follow your status in real time and get your visa by email.",
      icon: PackageCheck,
    },
  ];

  const faqs = [
    {
      q: `Who needs a ${visa.name}?`,
      a: `Anyone traveling to ${countryName} for ${categoryLabel.toLowerCase().replace(" visa", "")} purposes who is not visa-exempt under a travel agreement.`,
    },
    {
      q: "Can I expedite processing?",
      a: "Some destinations offer faster processing for an additional fee. This will be offered at checkout if available for your route.",
    },
    {
      q: "What happens if my application is refused?",
      a: "You'll be notified with the reason on file, and government fees are non-refundable. Our service fee is refunded if a resubmission isn't possible.",
    },
    {
      q: "Can I edit my application after submitting?",
      a: "Minor corrections can be made before the application enters review. Contact support as soon as possible if you spot an error.",
    },
  ];

  const included = [
    "Application review before submission",
    "Real-time status tracking",
    "24/7 customer support",
    "Secure document storage",
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-28 xl:pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
        <Link
          href="/dashboard/explore"
          className="inline-flex items-center gap-2 transition-colors hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" /> Explore visas
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-slate-400">{countryName}</span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="max-w-[160px] truncate text-slate-700 sm:max-w-xs">
          {visa.name}
        </span>
      </nav>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px] xl:items-start">
        {/* Main content */}
        <div className="min-w-0 space-y-6">
          {/* Main content */}
          <div className="min-w-0 space-y-6">
            <Card className="gap-0 overflow-hidden border-0 py-0 shadow-lg ring-1 ring-slate-200">
              <div className="relative h-64 w-full bg-slate-900 sm:h-80 lg:h-[26rem]">
                <img
                  src={`https://source.unsplash.com/1200x600/?${encodeURIComponent(countryName)},landmark`}
                  alt={countryName}
                  className="h-full w-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/40 to-transparent" />

                <button
                  className="absolute right-6 top-6 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                  aria-label="Save visa"
                >
                  <Heart className="h-5 w-5" />
                </button>

                <div className="absolute bottom-8 left-5 right-5 sm:left-8 sm:right-8">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge className="border-0 bg-white px-3 py-1 font-semibold text-slate-900 shadow-sm hover:bg-slate-100">
                      {flag} {countryName}
                    </Badge>
                    <Badge className="border-0 bg-white/15 px-3 py-1 font-medium text-white backdrop-blur-md hover:bg-white/20">
                      {categoryLabel}
                    </Badge>
                    <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      4.8
                      <span className="hidden font-normal text-white/70 sm:inline">
                        (1,240 reviews)
                      </span>
                    </span>
                  </div>
                  <h1 className="mb-3 text-3xl font-semibold text-white sm:text-4xl">
                    {visa.name}
                  </h1>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm font-medium text-white/90">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" /> {visa.entryType} entry
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {visa.stayDuration
                        ? `Up to ${visa.stayDuration} days`
                        : "Variable stay"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-b border-slate-100 bg-white sm:grid-cols-5 sm:divide-y-0">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-start gap-2.5 p-4 sm:p-5"
                  >
                    <s.icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="mb-0.5 text-xs font-medium text-slate-500">
                        {s.label}
                      </p>
                      <p
                        className={`truncate text-sm font-semibold text-slate-900 ${s.className ?? ""}`}
                      >
                        {s.value}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="col-span-2 flex items-start gap-2.5 bg-blue-50/60 p-4 sm:col-span-1 sm:p-5">
                  <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <div>
                    <p className="mb-0.5 text-xs font-medium text-blue-600">
                      Price from
                    </p>
                    <p className="text-sm font-bold text-blue-700">
                      ${(visa.priceStandard / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="gap-0 bg-white">
                <div className="relative">
                  <TabsList className="group h-auto w-full justify-start gap-0 overflow-x-auto rounded-none bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1 sm:px-8 [&::-webkit-scrollbar]:hidden">
                    {TABS.map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="shrink-0 whitespace-nowrap rounded-none border-b-2 border-transparent px-3.5 py-3.5 text-sm font-medium text-slate-600 shadow-none transition-colors hover:text-slate-900 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none sm:px-4 sm:py-4 sm:text-[15px]"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="pointer-events-none absolute inset-y-0 left-0 right-12 hidden w-8 bg-linear-to-r from-white to-transparent sm:block md:hidden" />
                </div>

                {/* Overview */}
                <TabsContent value="overview" className="p-5 sm:p-8">
                  <h3 className="mb-3 text-xl font-semibold text-slate-900">
                    About this visa
                  </h3>
                  <p className="max-w-3xl text-base leading-relaxed text-slate-600">
                    {visa.description ||
                      `The ${visa.name} allows you to visit ${countryName} for tourism, visiting family or friends, or short-term recreation. This visa allows you to travel within the country's boundaries and experience everything it has to offer.`}
                  </p>

                  <h3 className="mb-4 mt-8 text-xl font-semibold text-slate-900 sm:mt-10 sm:mb-5">
                    Highlights
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {highlights.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
                      >
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <p className="mb-1.5 text-[15px] font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <p className="text-sm leading-relaxed text-slate-600">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  <h3 className="mb-4 mt-8 text-xl font-semibold text-slate-900 sm:mt-10">
                    What's included
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {included.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2.5 text-[15px] text-slate-700"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        {item}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Requirements */}
                <TabsContent value="requirements" className="p-5 sm:p-8">
                  <h3 className="mb-1 text-xl font-semibold text-slate-900">
                    What you'll need
                  </h3>
                  <p className="mb-5 text-[15px] text-slate-600 sm:mb-6">
                    Have these ready before you start your application to{" "}
                    {countryName}.
                  </p>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {requirementGroups.map((group) => (
                      <div
                        key={group.title}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
                      >
                        <p className="mb-4 text-[15px] font-semibold text-slate-900">
                          {group.title}
                        </p>
                        <ul className="space-y-3">
                          {group.items.map((item) => (
                            <li
                              key={item}
                              className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700 sm:text-[15px]"
                            >
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Fees */}
                <TabsContent value="fees" className="p-5 sm:p-8">
                  <div className="flex flex-col gap-6 lg:flex-row">
                    <div className="flex-1 rounded-xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                        Standard processing
                      </p>
                      <p className="mt-1.5 text-3xl font-bold text-blue-700">
                        ${(visa.priceStandard / 100).toFixed(2)}
                      </p>
                      <p className="mt-1 text-[15px] text-slate-600">
                        {visa.processingDaysMin}–{visa.processingDaysMax}{" "}
                        business days
                      </p>
                      <Separator className="my-5" />
                      <ul className="space-y-3">
                        {included.map((item) => (
                          <li
                            key={item}
                            className="flex items-center gap-2.5 text-sm leading-relaxed text-slate-700 sm:text-[15px]"
                          >
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex-1 space-y-3 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                      <p className="text-base font-semibold text-slate-900">
                        Good to know
                      </p>
                      <p>
                        Government fees are set by the {countryName} authorities
                        and are included in the price shown. Our service fee
                        covers document review, submission, and tracking.
                      </p>
                      <p>
                        If your application is refused, government fees are
                        non-refundable. Our service fee is refunded whenever a
                        resubmission isn't possible — see the FAQs for details.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* Processing */}
                <TabsContent value="processing" className="p-5 sm:p-8">
                  <h3 className="mb-6 text-xl font-semibold text-slate-900 sm:mb-8">
                    How it works
                  </h3>
                  <div className="ml-3 sm:ml-4">
                    {processSteps.map((step, i) => (
                      <div
                        key={step.title}
                        className={`relative flex gap-4 pb-7 pl-9 last:pb-0 sm:gap-5 sm:pb-9 sm:pl-9 ${
                          i < processSteps.length - 1
                            ? "border-l-2 border-slate-200"
                            : "border-l-2 border-transparent"
                        }`}
                      >
                        <span className="absolute -left-4 top-0 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 ring-4 ring-white">
                          <step.icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-slate-900">
                            {step.title}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Documents */}
                <TabsContent value="documents" className="p-5 sm:p-8">
                  <h3 className="mb-1 text-xl font-semibold text-slate-900">
                    Documents to upload
                  </h3>
                  <p className="mb-5 text-[15px] text-slate-600 sm:mb-6">
                    Accepted as PDF or image files during your application.
                  </p>
                  <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
                    {documents.map((doc) => (
                      <div
                        key={doc.name}
                        className="flex items-center justify-between gap-3 bg-white p-4 sm:gap-4"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <FileText className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-medium text-slate-900">
                              {doc.name}
                            </p>
                            <p className="truncate text-sm text-slate-500">
                              {doc.format}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="hidden shrink-0 border-slate-300 font-normal text-slate-600 sm:inline-flex"
                        >
                          Required
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* FAQs */}
                <TabsContent value="faqs" className="p-5 sm:p-8">
                  <h3 className="mb-4 text-xl font-semibold text-slate-900">
                    Frequently asked questions
                  </h3>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, i) => (
                      <AccordionItem key={faq.q} value={`faq-${i}`}>
                        <AccordionTrigger className="text-left text-sm font-medium text-slate-900 hover:no-underline sm:text-[15px]">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Reviews teaser */}
            <Card className="border-0 shadow-sm ring-1 ring-slate-200">
              <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {["A", "M", "S"].map((initial) => (
                      <Avatar
                        key={initial}
                        className="h-10 w-10 border-2 border-white"
                      >
                        <AvatarFallback className="bg-blue-100 text-sm font-semibold text-blue-700">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      <span className="font-semibold text-slate-900">
                        1,240 travelers
                      </span>{" "}
                      applied for this visa through VisaFlow
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="shrink-0 border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Read reviews
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-6">
            <Card className="border-0 shadow-lg ring-1 ring-slate-200">
              <CardContent className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Apply for this visa
                  </h3>
                  <Badge className="border-0 bg-blue-50 font-semibold text-blue-600 hover:bg-blue-50">
                    ${(visa.priceStandard / 100).toFixed(2)}
                  </Badge>
                </div>
                <div className="mb-8 space-y-4">
                  {[
                    "Simple 3-step application",
                    "Secure online payment",
                    "Track application in real time",
                    "24/7 customer support",
                  ].map((perk) => (
                    <div key={perk} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                      <span className="pt-0.5 text-sm leading-tight text-slate-600">
                        {perk}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-blue-600 text-white shadow-md hover:bg-blue-700"
                  >
                    <Link
                      href={`/dashboard/applications/new?visaId=${visa.id}`}
                    >
                      Apply now
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <Heart className="mr-2 h-4 w-4" /> Save for later
                  </Button>
                </div>

                <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <Lock className="h-3.5 w-3.5" />
                  Payments secured with bank-level encryption
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-blue-50/50 shadow-sm ring-1 ring-slate-200">
              <CardContent className="p-6">
                <h3 className="mb-2 font-semibold text-slate-900">
                  Need help?
                </h3>
                <p className="mb-5 text-sm text-slate-600">
                  Our support team is here to help with your application.
                </p>
                <div className="space-y-2">
                  {SUPPORT_OPTIONS.map(({ label, icon: Icon, meta }) => (
                    <button
                      key={label}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-left text-sm font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-slate-400" />
                        <span>
                          {label}
                          <span className="block text-xs font-normal text-slate-400">
                            {meta}
                          </span>
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-4 text-slate-400">
              <BadgeCheck className="h-5 w-5" />
              <Send className="h-5 w-5" />
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs">
                Trusted visa processing since 2019
              </span>
            </div>
          </div>
        </div>

        {/* Sticky mobile CTA */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-4 backdrop-blur-md xl:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500">Price from</p>
              <p className="text-lg font-bold text-blue-700">
                ${(visa.priceStandard / 100).toFixed(2)}
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="flex-1 bg-blue-600 text-white shadow-md hover:bg-blue-700 sm:flex-none"
            >
              <Link href={`/dashboard/applications/new?visaId=${visa.id}`}>
                Apply now
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
