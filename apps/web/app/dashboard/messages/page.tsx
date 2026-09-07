"use client";
import React, { useEffect, useState } from "react";
import {
  Search, Filter, ArrowLeft, Download, MoreHorizontal, Send, Mail, Star, Archive, Trash2,
  AlertCircle, X, User, FileText
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { getResponseItems } from "@/lib/api-response";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function MessagesPage() {
  // Use any because the exact structure of NotificationEntity depends on the DB schema
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  useEffect(() => {
    api.get("/notifications?limit=50")
      .then(res => {
        const items = getResponseItems<any>(res.data);
        setMessages(items);
        if (items.length > 0) {
          setActiveMessageId(items[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeMessage = messages.find(m => m.id === activeMessageId);

  return (
    <div className="max-w-[1400px] mx-auto pb-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
        <p className="mt-1 text-slate-500">Stay updated with important notifications and messages.</p>
      </div>

      <div className="grid min-h-[720px] gap-4 xl:grid-cols-[200px_360px_1fr_240px]">
        {/* Left Sidebar - Folders */}
        <Card className="p-4 border-slate-200">
          <Button variant="brand" className="w-full mb-6 gap-2">
            <Mail className="w-4 h-4" /> New Message
          </Button>
          
          <div className="space-y-1">
            {["Inbox", "Starred", "Important", "Sent", "Drafts", "Trash"].map((x, i) => (
              <button 
                key={x}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  i === 0 ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {x}
                {i === 0 && (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {messages.filter(m => m.status === 'UNREAD').length || 3}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <hr className="my-6 border-slate-100" />
          
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Labels</p>
          <div className="space-y-1">
            {["Visa Applications", "Payments", "Documents", "Appointments", "General"].map(x => (
              <button key={x} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                <span className="w-2 h-2 rounded-full bg-slate-300" /> {x}
              </button>
            ))}
          </div>
        </Card>

        {/* Message List */}
        <Card className="flex flex-col border-slate-200 overflow-hidden">
          <div className="flex gap-2 border-b border-slate-100 p-3 bg-slate-50/50">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-shadow">
              <Search className="w-4 h-4" />
              <input type="text" placeholder="Search messages..." className="w-full bg-transparent outline-none text-slate-700" />
            </div>
            <button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
          
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                <Mail className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                No messages found.
              </div>
            ) : (
              messages.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveMessageId(m.id)}
                  className={`w-full text-left p-4 transition-colors ${
                    activeMessageId === m.id ? "bg-blue-50/60" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-sm">
                      VF
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className={`text-sm truncate pr-2 ${m.status === 'UNREAD' ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                          Visaflow Team
                        </span>
                        <span className="text-xs text-slate-500 shrink-0">
                          {dayjs(m.createdAt).fromNow(true)}
                        </span>
                      </div>
                      <p className={`truncate text-sm mb-0.5 ${m.status === 'UNREAD' ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
                        {m.subject || m.title || "Notification"}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {m.body || m.message}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Message View */}
        <Card className="flex flex-col border-slate-200 overflow-hidden relative">
          {activeMessage ? (
            <>
              <div className="flex items-center gap-4 border-b border-slate-100 p-4 text-slate-500 bg-white">
                <button className="p-1.5 hover:bg-slate-100 rounded transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                <button className="p-1.5 hover:bg-slate-100 rounded transition-colors ml-auto"><Download className="w-4 h-4" /></button>
                <button className="p-1.5 hover:bg-slate-100 rounded transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
              </div>
              
              <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{activeMessage.subject || activeMessage.title || "Notification"}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-medium text-slate-900">Visaflow Team</span>
                      <span className="text-sm text-slate-500">&lt;no-reply@visaflow.com&gt;</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{dayjs(activeMessage.createdAt).format('MMMM D, YYYY h:mm A')}</p>
                  </div>
                  <span className="inline-flex rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 shrink-0">
                    {activeMessage.channel || "IN_APP"}
                  </span>
                </div>
                
                <div className="prose prose-sm prose-slate max-w-none text-slate-600">
                  <p>Hello,</p>
                  <p className="mt-4 whitespace-pre-wrap">{activeMessage.body || activeMessage.message}</p>
                  
                  {activeMessage.type === 'STATUS_CHANGE' && (
                    <div className="my-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <b>Status Update</b>
                      <p className="mt-1 text-sm text-slate-600">Your application status has changed.</p>
                    </div>
                  )}

                  <p className="mt-6">Thank you for choosing Visaflow.</p>
                  <p className="mt-4">Best regards,<br/>Visaflow Team</p>
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 mt-auto">
                <Button variant="outline" className="gap-2 bg-white">
                  <Send className="w-4 h-4" /> Reply
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Mail className="w-12 h-12 mb-4 text-slate-200" />
              <p>Select a message to read</p>
            </div>
          )}
        </Card>

        {/* Right Sidebar - Contact Info */}
        <aside className="space-y-4">
          <Card className="p-6 text-center border-slate-200">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xl font-bold text-white shadow-md">
              VF
            </div>
            <p className="mt-4 font-semibold text-slate-900">Visaflow Team</p>
            <p className="text-xs text-slate-500 mb-6">no-reply@visaflow.com</p>
            <Button variant="outline" className="w-full">View Profile</Button>
          </Card>
          
          <Card className="p-5 border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">About this sender</h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Official messages from Visaflow regarding your applications, payments, documents and appointments.
            </p>
          </Card>
          
          <Card className="bg-blue-50 border-blue-100 p-5">
            <h3 className="text-sm font-semibold text-blue-800">Need Help?</h3>
            <p className="mt-2 text-xs text-blue-600/80">
              Our support team is here to help with your queries.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
