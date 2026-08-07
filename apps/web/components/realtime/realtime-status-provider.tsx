"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getAccessToken } from "@/lib/api";

export type RealtimeEvent = { type: string; payload: Record<string, unknown>; createdAt: string };
const RealtimeContext = createContext<{ events: RealtimeEvent[] }>({ events: [] });

export function RealtimeStatusProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const source = new EventSource(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1/realtime/events?access_token=${token}`);
    source.onmessage = (message) => setEvents((current) => [JSON.parse(message.data) as RealtimeEvent, ...current].slice(0, 50));
    return () => source.close();
  }, []);
  const value = useMemo(() => ({ events }), [events]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeEvents() { return useContext(RealtimeContext); }
