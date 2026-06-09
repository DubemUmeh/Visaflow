"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2, LifeBuoy, Mail, MessageSquare, User, BadgeCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { getResponseItems } from "@/lib/api-response";
import type { ApplicationSummary, SupportTicketEntity, UserEntity } from "@visaflow/shared-types";
import { toast } from "sonner";

type SupportTicketWithUser = SupportTicketEntity;

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicketWithUser[]>([]);
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.get("/support/tickets?limit=100"), api.get("/applications?limit=200")])
      .then(([ticketRes, appRes]) => {
        const nextTickets = getResponseItems<SupportTicketWithUser>(ticketRes.data.data);
        setTickets(nextTickets);
        setApplications(getResponseItems<ApplicationSummary>(appRes.data.data));
        setSelectedId((current) => current ?? nextTickets[0]?.id ?? null);
      })
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? null;
  const requesterTickets = useMemo(() => selected?.userId ? tickets.filter((ticket) => ticket.userId === selected.userId) : [], [selected, tickets]);
  const requesterApplications = useMemo(() => selected?.userId ? applications.filter((app) => app.userId === selected.userId) : [], [selected, applications]);
  const issuedVisas = requesterApplications.filter((app) => ["APPROVED", "COMPLETED"].includes(app.status));

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/support/tickets/${id}`, { status });
      toast.success("Ticket updated");
      load();
    } catch {
      toast.error("Could not update ticket");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Support</h1>
        <p className="mt-1 text-muted-foreground">Click a support message to view the full conversation, requester details, previous support history, and issued-visa context.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-coral" /></div>
      ) : tickets.length === 0 ? (
        <Card className="py-16 text-center text-muted-foreground/70"><LifeBuoy className="mx-auto mb-2 h-10 w-10 opacity-40" /><p>No support tickets</p></Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
          <Card className="overflow-hidden">
            <CardHeader><CardTitle className="text-base">Inbox</CardTitle></CardHeader>
            <CardContent className="space-y-2 p-3 pt-0">
              {tickets.map((ticket) => (
                <button key={ticket.id} onClick={() => setSelectedId(ticket.id)} className={`w-full rounded-2xl border p-4 text-left transition hover:border-coral/40 ${selectedId === ticket.id ? "border-coral bg-coral/5" : "border-border/70"}`}>
                  <div className="flex items-start justify-between gap-3"><p className="font-medium text-foreground">{ticket.subject}</p><Badge>{ticket.status.replace(/_/g, " ")}</Badge></div>
                  <p className="mt-1 text-xs text-muted-foreground">{ticket.ticketNumber} · {ticket.priority}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{ticket.messages[0]?.body ?? "No message body"}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {selected && (
            <div className="space-y-5">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div><CardTitle>{selected.subject}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{selected.ticketNumber} · created {new Date(selected.createdAt).toLocaleString()}</p></div>
                  <Badge variant={selected.priority === "URGENT" ? "destructive" : "secondary"}>{selected.priority}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-muted p-3"><User className="mb-2 h-4 w-4 text-coral" /><p className="text-xs text-muted-foreground">Requester</p><p className="text-sm font-semibold">{selected.requester ? `${selected.requester.firstName} ${selected.requester.lastName}` : selected.userId ?? "Guest"}</p></div>
                    <div className="rounded-xl bg-muted p-3"><BadgeCheck className="mb-2 h-4 w-4 text-coral" /><p className="text-xs text-muted-foreground">Issued visas</p><p className="text-sm font-semibold">{issuedVisas.length}</p></div>
                    <div className="rounded-xl bg-muted p-3"><LifeBuoy className="mb-2 h-4 w-4 text-coral" /><p className="text-xs text-muted-foreground">Past support</p><p className="text-sm font-semibold">{requesterTickets.length}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "IN_PROGRESS")}>Mark in review</Button><Button size="sm" variant="brand" onClick={() => updateStatus(selected.id, "RESOLVED")}>Resolve</Button><Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "CLOSED")}>Close</Button></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4" /> Conversation</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {selected.messages.map((message) => (
                    <div key={message.id} className="rounded-2xl border border-border/70 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3"><p className="text-sm font-semibold text-foreground">{message.author ? `${message.author.firstName} ${message.author.lastName}` : "Guest / system"}</p><span className="text-xs text-muted-foreground">{new Date(message.createdAt).toLocaleString()}</span></div>
                      <p className="text-sm leading-6 text-muted-foreground">{message.body}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Mail className="h-4 w-4" /> Requester history</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Past support</p>{requesterTickets.map((ticket) => <p key={ticket.id} className="mb-2 rounded-lg bg-muted px-3 py-2 text-sm">{ticket.ticketNumber} · {ticket.status.replace(/_/g, " ")}</p>)}</div>
                  <div><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Issued visas</p>{issuedVisas.length ? issuedVisas.map((app) => <p key={app.id} className="mb-2 rounded-lg bg-muted px-3 py-2 text-sm">{app.referenceNumber} · {app.destinationCountry.name}</p>) : <p className="text-sm text-muted-foreground">No approved or completed applications found in the loaded dataset.</p>}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
