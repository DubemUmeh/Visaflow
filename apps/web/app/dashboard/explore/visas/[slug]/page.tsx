import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Heart, Clock, Calendar, Repeat, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import type { VisaTypeEntity } from "@visaflow/shared-types";

async function getVisaType(slug: string): Promise<VisaTypeEntity | null> {
  try {
    const res = await api.get(`/visa-types/${slug}`);
    return res.data?.data ?? res.data;
  } catch (err) {
    return null;
  }
}

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

export default async function VisaDetailsPage(props: PageProps) {
  const resolvedParams = await Promise.resolve(props.params);
  const visa = await getVisaType(resolvedParams?.slug);

  if (!visa) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">
      <Link 
        href="/dashboard/explore" 
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Explore Visas
      </Link>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px] items-start">
        {/* Main Content */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-slate-200">
            {/* Header Image Area */}
            <div className="relative h-[320px] sm:h-[400px] w-full bg-slate-900">
              {/* Uses a random unsplash image as placeholder */}
              <img 
                src={`https://source.unsplash.com/1200x600/?${encodeURIComponent(visa.destinationCountry?.name || 'travel')},landmark`}
                alt={visa.destinationCountry?.name || visa.name} 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              
              <div className="absolute top-6 right-6">
                <button className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
              </div>

              <div className="absolute bottom-8 left-8 right-8">
                <Badge className="bg-white text-slate-900 hover:bg-slate-100 font-semibold px-3 py-1 mb-4 shadow-sm border-0">
                  {visa.destinationCountry?.flagEmoji || '🌍'} {visa.destinationCountry?.name || 'Destination'}
                </Badge>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                  {visa.name}
                </h1>
                <div className="flex flex-wrap gap-4 text-white/90 text-sm font-medium">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> {visa.entryType} Entry
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> {visa.stayDuration ? `Up to ${visa.stayDuration} Days` : "Variable Stay"}
                  </span>
                </div>
              </div>
            </div>

            {/* Key Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-slate-100 border-b border-slate-100 bg-white">
              <div className="p-4 sm:p-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Processing</p>
                <p className="font-semibold text-slate-900">{visa.processingDaysMin}-{visa.processingDaysMax} days</p>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Validity</p>
                <p className="font-semibold text-slate-900">{visa.validityPeriod ?? "Variable"}</p>
              </div>
              <div className="p-4 sm:p-5 hidden sm:block">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Entry</p>
                <p className="font-semibold text-slate-900 capitalize">{visa.entryType}</p>
              </div>
              <div className="p-4 sm:p-5 hidden sm:block">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Stay</p>
                <p className="font-semibold text-slate-900">{visa.stayDuration ? `Up to ${visa.stayDuration} days` : "Variable"}</p>
              </div>
              <div className="p-4 sm:p-5 bg-blue-50/50">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Price From</p>
                <p className="font-bold text-blue-700 text-lg">${(visa.priceStandard / 100).toFixed(2)}</p>
              </div>
            </div>

            {/* Content Tabs (Visual only for now) */}
            <div className="flex overflow-x-auto gap-8 px-6 border-b border-slate-100 bg-white hide-scrollbar">
              <button className="whitespace-nowrap py-4 text-sm font-semibold text-blue-600 border-b-2 border-blue-600">
                Overview
              </button>
              {["Requirements", "Fees", "Processing", "Documents", "FAQs"].map(tab => (
                <button key={tab} className="whitespace-nowrap py-4 text-sm font-medium text-slate-500 hover:text-slate-700">
                  {tab}
                </button>
              ))}
            </div>

            {/* Overview Content */}
            <div className="p-6 sm:p-8 bg-white">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">About this Visa</h3>
              <p className="text-slate-600 leading-relaxed max-w-3xl">
                {visa.description || `The ${visa.name} allows you to visit ${visa.destinationCountry?.name || 'the destination country'} for tourism, visiting family or friends, or short-term recreation. This visa allows you to travel within the country boundaries and experience everything it has to offer.`}
              </p>

              <h3 className="text-lg font-semibold text-slate-900 mt-10 mb-5">Highlights</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: `Explore ${visa.destinationCountry?.name || 'Destination'}`, desc: "Experience the culture and landmarks" },
                  { title: "Tourism & Leisure", desc: "Perfect for holidays and visits" },
                  { title: "Easy Application", desc: "Simple online process with clear requirements" },
                  { title: "Secure Processing", desc: "Bank-level encryption for your data" }
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-slate-900 mb-1.5">{item.title}</p>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg ring-1 ring-slate-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-5">Apply for this Visa</h3>
              <div className="space-y-4 mb-8">
                {[
                  "Simple 3-step application",
                  "Secure online payment",
                  "Track application in real-time",
                  "24/7 customer support"
                ].map((perk, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-sm text-slate-600 leading-tight pt-0.5">{perk}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3">
                <Button asChild size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                  <Link href={`/dashboard/applications/new?visaId=${visa.id}`}>
                    Apply Now
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50">
                  <Heart className="w-4 h-4 mr-2" /> Save for Later
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-blue-50/50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-900 mb-2">Need Help?</h3>
              <p className="text-sm text-slate-600 mb-5">
                Our support team is here to help you with your application.
              </p>
              <div className="space-y-2">
                {["Live Chat", "Email Support", "Call Support"].map((option, i) => (
                  <button key={i} className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                    {option}
                    <ArrowLeft className="w-4 h-4 rotate-180 text-slate-400" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
