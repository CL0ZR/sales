"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Package,
  ShoppingCart,
  TrendingUp,
  Menu,
  Users,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import UserManagement from "@/components/UserManagement";

const navigationItems = [
  {
    id: "dashboard",
    name: "لوحة التحكم",
    icon: BarChart3,
    path: "/",
  },
  {
    id: "warehouse",
    name: "المستودع",
    icon: Package,
    path: "/warehouse",
  },
  {
    id: "products",
    name: "المبيعات",
    icon: ShoppingCart,
    path: "/products",
  },
  {
    id: "reports",
    name: "التقارير",
    icon: TrendingUp,
    path: "/reports",
  },
];

function NavigationContent() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">نظام إدارة المستودعات</h1>
        <p className="text-sm text-muted-foreground mt-1">
          إدارة المبيعات والمخزون
        </p>
        {user && (
          <div className="mt-3 p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              {user.role === "admin" ? (
                <Shield className="h-4 w-4 text-red-500" />
              ) : (
                <Users className="h-4 w-4 text-blue-500" />
              )}
              <span className="text-sm font-medium text-gray-700">
                {user.fullName || user.username}
              </span>
              <Badge
                variant={user.role === "admin" ? "destructive" : "default"}
                className="text-xs"
              >
                {user.role === "admin" ? "مدير" : "مستخدم"}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.id}
                href={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900"
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Admin Actions */}
      {isAdmin() && (
        <div className="p-4 border-t">
          <Dialog
            open={isUserManagementOpen}
            onOpenChange={setIsUserManagementOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                إدارة المستخدمين
              </Button>
            </DialogTrigger>
            <DialogContent size="6xl" className="max-h-[100vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle></DialogTitle>
              </DialogHeader>
              <UserManagement />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Logout Button */}
      <div className="p-4 border-t">
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );
}

export default function Navigation() {
  return (
    <>
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed top-4 right-4 z-50 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>قائمة التنقل</SheetTitle>
            </SheetHeader>
            <NavigationContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:block fixed top-0 right-0 h-full w-64 border-l bg-white/80 backdrop-blur-sm">
        <NavigationContent />
      </div>
    </>
  );
}
