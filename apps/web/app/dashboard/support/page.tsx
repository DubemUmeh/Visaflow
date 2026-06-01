'use client';
import { useEffect, useState } from 'react';
import { LifeBuoy, Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { getResponseItems } from '@/lib/api-response';
import type { SupportTicketEntity } from '@visaflow/shared-types';
import { toast } from 'sonner';

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicketEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/support/tickets?limit=20')
      .then(({ data }) => setTickets(getResponseItems<SupportTicketEntity>(data.data)))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const createTicket = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/support/tickets', { subject, body, category: 'general' });
      setSubject('');
      setBody('');
      toast.success('Support ticket created');
      load();
    } catch {
      toast.error('Could not create support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-500 mt-1">Create and track requests with the VisaFlow team.</p>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your tickets</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
            ) : tickets.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <LifeBuoy className="mx-auto mb-2 h-10 w-10 opacity-40" />
                <p className="text-sm">No support tickets yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{ticket.subject}</p>
                        <p className="mt-1 text-xs text-gray-500">{ticket.ticketNumber} · {ticket.category}</p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        {ticket.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {ticket.messages[0] && <p className="mt-3 text-sm text-gray-600">{ticket.messages[0].body}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">New ticket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Tell us what you need help with..."
            className="min-h-32 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button variant="brand" className="w-full gap-2" onClick={createTicket} isLoading={submitting}>
            <Send className="h-4 w-4" />
            Send request
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
