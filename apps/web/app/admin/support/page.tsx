'use client';
import { useEffect, useState } from 'react';
import { Loader2, LifeBuoy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { getResponseItems } from '@/lib/api-response';
import type { SupportTicketEntity } from '@visaflow/shared-types';
import { toast } from 'sonner';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicketEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/support/tickets?limit=100')
      .then(({ data }) => setTickets(getResponseItems<SupportTicketEntity>(data.data)))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/support/tickets/${id}`, { status });
      toast.success('Ticket updated');
      load();
    } catch {
      toast.error('Could not update ticket');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support</h1>
        <p className="text-gray-500 mt-1">Review customer tickets and update their status.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
      ) : tickets.length === 0 ? (
        <Card className="py-16 text-center text-gray-400">
          <LifeBuoy className="mx-auto mb-2 h-10 w-10 opacity-40" />
          <p>No support tickets</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Ticket', 'Status', 'Priority', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket.id} className="border-b border-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{ticket.subject}</p>
                    <p className="text-xs text-gray-400">{ticket.ticketNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{ticket.status.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-xs">{ticket.priority}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateStatus(ticket.id, 'IN_PROGRESS')}>Review</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(ticket.id, 'RESOLVED')}>Resolve</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
