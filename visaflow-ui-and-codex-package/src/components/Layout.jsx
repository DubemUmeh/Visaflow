import React from "react";
import { Icon } from "./Icon";

const nav = [
  ["Dashboard","home"], ["My Applications","applications"], ["Explore Visas","globe"],
  ["Documents","file"], ["Appointments","calendar"], ["Payments","card"],
  ["Messages","message"], ["Wallet","wallet"], ["Profile","user"], ["Settings","settings"]
];

export default function Layout({ active, children }) {
  return <div className="min-h-screen bg-[#f7f9fc] text-[#111827]">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[250px] border-r border-[#e6eaf0] bg-white lg:block">
      <div className="flex h-[76px] items-center gap-3 border-b border-transparent px-7">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-[#1264ff] text-white"><span className="font-black">V</span></div>
        <span className="text-[25px] font-bold tracking-tight">visaflow</span>
      </div>
      <nav className="px-3 py-4">
        {nav.map(([label, icon]) => <a key={label} href="#" className={`mb-1 flex h-11 items-center gap-4 rounded-lg px-4 text-[14px] font-medium ${active===label ? "bg-[#eaf2ff] text-[#1264ff]" : "text-[#263244] hover:bg-slate-50"}`}>
          <Icon name={icon} size={19}/><span>{label}</span>{label==="Messages" && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#1264ff] px-1 text-[11px] text-white">3</span>}
        </a>)}
      </nav>
      <div className="absolute bottom-24 left-5 right-5 rounded-xl bg-[#edf5ff] p-4">
        <p className="text-sm font-semibold text-[#1264ff]">Refer & Earn</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">Invite friends and earn $10 for each successful application.</p>
        <button className="mt-3 rounded-lg bg-[#1264ff] px-4 py-2 text-xs font-semibold text-white">Invite Now</button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 px-6 py-5 text-xs text-slate-500">© 2025 Visaflow<br/>All rights reserved.</div>
    </aside>
    <header className="fixed left-0 right-0 top-0 z-10 h-[76px] border-b border-[#e6eaf0] bg-white lg:left-[250px]">
      <div className="flex h-full items-center gap-5 px-5 lg:px-8">
        <button className="lg:hidden"><Icon name="menu"/></button>
        <div className="flex h-11 max-w-[500px] flex-1 items-center gap-3 rounded-lg border border-[#dfe4ea] bg-white px-4 text-slate-400">
          <Icon name="search" size={19}/><span className="text-sm">Search visas, applications, documents...</span>
        </div>
        <div className="ml-auto flex items-center gap-5">
          <div className="relative"><Icon name="bell" size={21}/><span className="absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[9px] text-white">3</span></div>
          <Icon name="message" size={20} className="text-slate-600"/>
          <div className="hidden items-center gap-3 sm:flex"><div className="h-10 w-10 rounded-full bg-slate-200" /><div><p className="text-sm font-semibold">Emmanuel O.</p><p className="text-xs text-slate-500">Premium</p></div></div>
        </div>
      </div>
    </header>
    <main className="min-h-screen pt-[76px] lg:pl-[250px]"><div className="mx-auto max-w-[1500px] p-5 lg:p-7">{children}</div></main>
  </div>
}
