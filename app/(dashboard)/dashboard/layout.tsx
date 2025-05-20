"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Users,
  Settings,
  Shield,
  Activity,
  Menu,
  Plus,
  Home,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AddNewSheet } from "../../../components/add-new-sheet";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", icon: Users, label: "Team" },
    { href: "/dashboard/general", icon: Settings, label: "General" },
    { href: "/dashboard/activity", icon: Activity, label: "Activity" },
    { href: "/dashboard/security", icon: Shield, label: "Security" },
  ];

  return (
    <div className="flex flex-col min-h-screen max-w-7xl mx-auto w-full">
      <main className="flex-1 overflow-y-auto p-0 lg:p-4 pb-20 lg:pb-4">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex-1">
              <Button
                variant="ghost"
                className={`w-full h-full flex flex-col items-center justify-center gap-1 ${
                  pathname === item.href ? "text-primary" : "text-gray-500"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            </Link>
          ))}

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="flex-1 h-full flex flex-col items-center justify-center gap-1"
              >
                <div className="bg-primary text-primary-foreground rounded-full p-2">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-xs">New</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="flex flex-col h-[90vh]">
              <SheetHeader>
                <SheetTitle className="text-xl font-bold text-center">
                  Add New
                </SheetTitle>
              </SheetHeader>

              <AddNewSheet />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
