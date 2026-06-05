'use client';
import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { getResponseItems } from '@/lib/api-response';
import type { NotificationEntity } from '@visaflow/shared-types';
import dayjs from 'dayjs';

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/notifications?limit=50')
      .then(({ data }) => setItems(getResponseItems<NotificationEntity>(data.data)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await api.patch('/notifications/read', { notificationIds: [] });
    load();
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">Updates about your applications, payments, and documents.</p>
        </div>
        <Button variant="outline" onClick={markAllRead} className="gap-2">
          <CheckCheck className="h-4 w-4" />
          Mark read
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent updates</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-coral" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground/70">
              <Bell className="mx-auto mb-2 h-10 w-10 opacity-40" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 py-4">
                  <div className={`mt-1 h-2.5 w-2.5 rounded-full ${item.readAt ? 'bg-gray-200' : 'bg-coral'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{item.subject ?? item.channel}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">{dayjs(item.createdAt).format('DD MMM YYYY, HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
