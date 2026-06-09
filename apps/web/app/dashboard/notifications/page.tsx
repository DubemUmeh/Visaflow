"use client";
import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/lib/api";
import { getResponseItems } from "@/lib/api-response";
import { cn } from "@/lib/utils";
import type { NotificationEntity } from "@visaflow/shared-types";
import dayjs from "dayjs";
import { toast } from "sonner";

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationEntity[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get("/notifications?limit=100")
      .then(({ data }) => setItems(getResponseItems<NotificationEntity>(data.data)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (!a.readAt && b.readAt) return -1;
        if (a.readAt && !b.readAt) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [items],
  );
  const unread = items.filter((item) => !item.readAt).length;
  const selectedCount = selected.length;

  const markAllRead = async () => {
    setBusy(true);
    try {
      await api.patch("/notifications/read", { notificationIds: [] });
      toast.success("All notifications marked as read");
      load();
    } catch {
      toast.error("Unable to mark notifications as read");
    } finally {
      setBusy(false);
    }
  };

  const deleteNotifications = async (ids?: string[]) => {
    setBusy(true);
    try {
      await api.delete("/notifications", { data: { notificationIds: ids ?? [] } });
      toast.success(ids?.length ? "Selected notifications deleted" : "All notifications deleted");
      setSelected([]);
      load();
    } catch {
      toast.error("Unable to delete notifications");
    } finally {
      setBusy(false);
    }
  };

  const toggleSelected = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow-pill">Notification center</span>
          <h1 className="mt-3 text-2xl font-bold text-foreground">Notifications</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Detailed account, application, document, and payment updates are sorted by unread status and date.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={markAllRead} disabled={busy || unread === 0} className="gap-2">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
          <Button
            variant="outline"
            onClick={() => deleteNotifications(selected)}
            disabled={busy || selectedCount === 0}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" /> Delete selected
          </Button>
          <Button variant="destructive" onClick={() => deleteNotifications()} disabled={busy || items.length === 0} className="gap-2">
            <Trash2 className="h-4 w-4" /> Delete all
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Total</p><p className="text-2xl font-bold">{items.length}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Unread</p><p className="text-2xl font-bold text-coral">{unread}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Selected</p><p className="text-2xl font-bold">{selectedCount}</p></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent updates and reasons</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-coral" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground/70">
              <Bell className="mx-auto mb-2 h-10 w-10 opacity-40" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              {sorted.map((item) => (
                <article
                  key={item.id}
                  className={cn(
                    "flex gap-4 py-5 transition-colors",
                    !item.readAt && "rounded-2xl bg-coral/5 px-3",
                  )}
                >
                  <Checkbox
                    checked={selected.includes(item.id)}
                    onCheckedChange={() => toggleSelected(item.id)}
                    aria-label={`Select ${item.subject ?? "notification"}`}
                    className="mt-1"
                  />
                  <div className={`mt-1 h-2.5 w-2.5 rounded-full ${item.readAt ? "bg-gray-200" : "bg-coral"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{item.subject ?? item.channel}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{item.channel}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", item.readAt ? "bg-gray-100 text-gray-500" : "bg-coral/10 text-coral")}>{item.readAt ? "Read" : "Unread"}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground/70">{dayjs(item.createdAt).format("DD MMM YYYY, HH:mm")}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
