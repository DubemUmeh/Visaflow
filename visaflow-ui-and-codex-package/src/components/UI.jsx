import React from "react";
import { Icon } from "./Icon";

export function PageHeader({ title, subtitle, action }) {
  return <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-[28px] font-bold tracking-tight">{title}</h1><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>{action}</div>
}
export function Card({ children, className="" }) { return <div className={`rounded-xl border border-[#e6eaf0] bg-white ${className}`}>{children}</div> }
export function Stat({ label, value, note, icon="card", tone="blue" }) {
  const tones={blue:"bg-blue-50 text-blue-600",green:"bg-emerald-50 text-emerald-600",orange:"bg-orange-50 text-orange-600",purple:"bg-violet-50 text-violet-600",red:"bg-red-50 text-red-600"};
  return <Card className="p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-[25px] font-bold">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></div><div className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}><Icon name={icon}/></div></div></Card>
}
export function Button({children, variant="primary", icon}) { return <button className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${variant==="primary"?"bg-[#1264ff] text-white hover:bg-[#0956e8]":"border border-[#1264ff] bg-white text-[#1264ff] hover:bg-blue-50"}`}>{icon && <Icon name={icon} size={17}/>} {children}</button> }
export function Badge({children, tone="green"}) { const c={green:"bg-emerald-50 text-emerald-700",orange:"bg-orange-50 text-orange-700",red:"bg-red-50 text-red-700",blue:"bg-blue-50 text-blue-700",purple:"bg-violet-50 text-violet-700"}; return <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${c[tone]}`}>{children}</span> }
