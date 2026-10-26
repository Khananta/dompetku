"use client";

import React from "react";
import { Icons } from "./Icons";

export default function Sidebar({
  activeTab,
  onTabChange,
  isSidebarOpen,
  setIsSidebarOpen,
  user,
  onLogout,
}) {
  const menuGroups = [
    {
      label: "MENU UTAMA",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: <Icons.Dashboard className="w-4 h-4" />,
        },
        {
          id: "pengeluaran",
          label: "Pengeluaran",
          icon: <Icons.Receipt className="w-4 h-4" />,
        },
      ],
    },
    {
      label: "PERENCANAAN",
      items: [
        {
          id: "saving-goals",
          label: "Target Tabungan",
          icon: <Icons.Target className="w-4 h-4" />,
        },
        {
          id: "billing-reminder",
          label: "Tagihan & Hutang",
          icon: <Icons.Bell className="w-4 h-4" />,
        },
        {
          id: "investasi",
          label: "Investasi",
          icon: <Icons.TrendingUp className="w-4 h-4" />,
        },
      ],
    },
    {
      label: "ALAT BANTU",
      items: [
        {
          id: "financial-calendar",
          label: "Kalender Finansial",
          icon: <Icons.Calendar className="w-4 h-4" />,
        },
        {
          id: "financial-calculator",
          label: "Kalkulator Pintar",
          icon: <Icons.Calculator className="w-4 h-4" />,
        },
        {
          id: "split-bill",
          label: "Bagi Tagihan",
          icon: <Icons.Users className="w-4 h-4" />,
        },
      ],
    },
    {
      label: "PENGATURAN",
      items: [
        {
          id: "settings",
          label: "Pengaturan",
          icon: <Icons.Settings className="w-4 h-4" />,
        },
      ],
    },
  ];

  const displayName =
    user?.user_metadata?.username ||
    user?.email?.split("@")[0] ||
    "Pengguna";

  return (
    <>
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-xs overflow-hidden p-0.5">
              <Icons.Logo className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-slate-900">
                Dompet<span className="text-emerald-600">Ku</span>
              </span>
              <p className="text-[10px] text-slate-400 font-normal leading-none mt-0.5">
                Personal Finance
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <p className="px-2.5 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                {group.label}
              </p>
              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id || (item.id === "pengeluaran" && activeTab === "riwayat");
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium active:scale-[0.98] transition-all ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 font-medium"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span className={`${isActive ? "text-emerald-600" : "text-slate-400"}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card & Logout Bottom */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-center shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email || "Akun Personal"}
                </p>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Keluar akun"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white active:scale-95 rounded-lg transition shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
