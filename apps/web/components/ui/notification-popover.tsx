'use client';
import { useState, useEffect } from "react";
import { NotificationEntity } from "@visaflow/shared-types";
import { getResponseItems } from "@/lib/api-response";
import api from "@/lib/api";
import * as Popover from '@radix-ui/react-popover';
import { ArrowRight, Bell, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime';
import Link from "next/link";

dayjs.extend(relativeTime);


export default function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);

  const sortedNotifications = [...notifications].sort((a, b) => {
    if (!a.readAt && b.readAt) return -1;
    if (a.readAt && !b.readAt) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const unread = notifications.filter((n) => !n.readAt).length;

  const load = () => {
    setLoading(true);
    api
      .get('/notifications?limit=20')
      .then(({ data }) => setNotifications(getResponseItems<NotificationEntity>(data.data)))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await api.patch('/notifications/read', { notificationIds: [] });
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    } catch {
      /* silent */
    } finally {
      setMarking(false);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          aria-label="Notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={10}
          className={cn(
            'z-50 w-[23rem] rounded-2xl border border-gray-100 bg-white shadow-[0_20px_60px_-12px_rgba(0,0,0,0.18)]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
            'data-[side=bottom]:slide-in-from-top-2',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-900">Notifications</span>
              {unread > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                  {unread}
                </span>
              )}
            </div>
            <button
              onClick={markAllRead}
              disabled={marking || unread === 0}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {marking ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCheck className="w-3 h-3" />
              )}
              Mark all read
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[26rem] overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <p className="text-xs text-gray-400">Loading notifications…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">All caught up!</p>
                <p className="text-xs text-gray-400">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {sortedNotifications.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50',
                      !item.readAt && 'bg-blue-50/40 hover:bg-blue-50/60',
                    )}
                  >
                    {/* Unread dot */}
                    <div className="mt-1.5 shrink-0">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          item.readAt ? 'bg-gray-200' : 'bg-blue-500',
                        )}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      {item.subject && (
                        <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
                          {item.subject}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 leading-relaxed mt-0.5 line-clamp-2">
                        {item.body}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-gray-400">
                        <span>{dayjs(item.createdAt).fromNow()}</span>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 font-medium",
                          item.readAt ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-700",
                        )}>
                          {item.readAt ? "Read" : "Unread"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2.5">
            <Popover.Close asChild>
              <Link
                href="/dashboard/notifications"
                className="flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
              >
                View all notifications
                <ArrowRight className="w-3 h-3" />
              </Link>
            </Popover.Close>
          </div>

          <Popover.Arrow className="fill-white drop-shadow-[0_-1px_0_rgba(0,0,0,0.06)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}