"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect } from "react";
import api from "@/handlers/globalAxios";
import { setUserProfile } from "@/store/features/auth/authSlice";
import { User } from "@/handlers/users/type";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isMobileOpen } = useSidebar();

  const user = useAppSelector(state => state.auth?.user);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!user) {
      console.log("get profile data");
      (async () => {
        try {
          const res = await api.get<User>("/auth/user-token");
          dispatch(setUserProfile(res.data));
        } catch(error: any) {
          console.log("error get user info: ", error.message);
        }
      })()
    }
  }, [user])

  
  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}
