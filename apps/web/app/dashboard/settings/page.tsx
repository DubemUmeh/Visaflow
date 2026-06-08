import Link from "next/link";
import { Bell, Shield, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const settings = [
  {
    href: "/dashboard/settings/profile",
    title: "Profile and verification",
    body: "Manage identity details, contact information, and email verification status.",
    icon: User,
  },
  {
    href: "/dashboard/notifications",
    title: "Notifications",
    body: "Review application alerts, support updates, and account events.",
    icon: Bell,
  },
  {
    href: "/dashboard/support",
    title: "Security support",
    body: "Contact support for account access, privacy, or payment questions.",
    icon: Shield,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your VisaFlow account, profile, and communication preferences.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {settings.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full transition hover:-translate-y-1 hover:shadow-card">
              <CardContent className="p-6">
                <item.icon className="mb-4 h-5 w-5 text-brand" />
                <h2 className="font-semibold text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
