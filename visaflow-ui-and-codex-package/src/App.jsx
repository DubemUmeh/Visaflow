import React from "react";
import ExploreVisas from "./pages/ExploreVisas";
import VisaDetails from "./pages/VisaDetails";
import Documents from "./pages/Documents";
import Messages from "./pages/Messages";
import Wallet from "./pages/Wallet";
import Payments from "./pages/Payments";

export default function App() {
  const p = window.location.pathname;
  if (p.includes("/documents")) return <Documents />;
  if (p.includes("/messages")) return <Messages />;
  if (p.includes("/wallet")) return <Wallet />;
  if (p.includes("/payments")) return <Payments />;
  if (p.includes("/explore/visas/")) return <VisaDetails />;
  return <ExploreVisas />;
}
