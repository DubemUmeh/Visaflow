import React from "react";
import Layout from "../components/Layout";
import { Icon } from "../components/Icon";
import { PageHeader, Card, Button, Badge } from "../components/UI";

const visas=[
["France","🇫🇷","Schengen Tourist Visa","Tourism","Short Stay","15 days","$80","https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=900"],
["United Arab Emirates","🇦🇪","Entry Visa","Tourism","Short Stay","4 - 5 days","$95","https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=900"],
["United States","🇺🇸","B1/B2 Visitor Visa","Tourism","Business","7 - 10 days","$160","https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=900"],
["United Kingdom","🇬🇧","Standard Visitor Visa","Tourism","Short Stay","6 - 8 days","$120","https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=900"],
["Japan","🇯🇵","Tourist Visa","Tourism","Short Stay","5 - 7 days","$70","https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=900"],
["Australia","🇦🇺","Visitor Visa (Subclass 600)","Tourism","Short Stay","10 - 15 days","$150","https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d5?w=900"],
["Singapore","🇸🇬","Tourist Visa","Tourism","Short Stay","3 - 4 days","$30","https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=900"],
["South Africa","🇿🇦","Visitor Visa","Tourism","Short Stay","7 - 10 days","$60","https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=900"]
];

export default function ExploreVisas(){
return <Layout active="Explore Visas"><PageHeader title="Explore Visas" subtitle="Find the right visa for your travel purpose. Apply with ease, track in real-time."/>
<div className="grid gap-4 xl:grid-cols-[245px_1fr]">
<Card className="p-4"><div className="flex justify-between"><h3 className="font-semibold">Filter Visas</h3><button className="text-xs text-blue-600">Clear all</button></div>
{["I'm traveling from","Destination","Visa Type","Processing Time"].map(x=><label key={x} className="mt-5 block text-xs font-semibold">{x}<select className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-600"><option>Select {x.toLowerCase()}</option></select></label>)}
<div className="mt-5 text-xs font-semibold">Purpose of Travel</div>{["Tourism","Business","Study","Work","Transit","Other"].map(x=><label className="mt-2 flex gap-2 text-sm text-slate-600" key={x}><input type="checkbox"/>{x}</label>)}
<div className="mt-6 text-xs font-semibold">Price Range (USD)</div><input className="mt-3 w-full accent-blue-600" type="range"/><div className="flex justify-between text-xs text-slate-500"><span>$0</span><span>$1000+</span></div><Button>Apply Filters</Button></Card>
<div><div className="mb-4 flex items-center justify-between"><span className="text-sm text-slate-600">136 visas found</span><select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option>Sort by: Popular</option></select></div>
<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{visas.map(v=><Card key={v[0]} className="overflow-hidden"><div className="relative h-36"><img src={v[7]} className="h-full w-full object-cover"/><button className="absolute right-3 top-3 text-white"><Icon name="heart"/></button></div><div className="p-3.5"><div className="flex items-center gap-2 font-semibold">{v[1]} {v[0]}</div><p className="mt-1 text-xs text-slate-500">{v[2]}</p><div className="mt-4 flex justify-between text-xs text-slate-500"><span>⚙ {v[3]}</span><span>◷ {v[4]}</span></div><div className="mt-5 flex justify-between text-xs"><div><p className="text-slate-400">Processing time</p><b>{v[5]}</b></div><div className="text-right"><p className="text-slate-400">From</p><b>{v[6]}</b></div></div><a href="/dashboard/explore/visas/france" className="mt-3 block rounded-lg border border-blue-500 py-2 text-center text-xs font-semibold text-blue-600">View Details</a></div></Card>)}</div></div></div></Layout>
}
