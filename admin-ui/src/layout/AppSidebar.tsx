"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  FolderIcon,
  GridIcon,
  PlugInIcon,
  BellIcon,
  BoxCubeIcon,
  TaskIcon,
} from "../icons/index";

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const isDashboardActive = pathname === "/";
  const isBackupsActive = pathname?.startsWith("/backups") ?? false;
  const isJobsActive = pathname?.startsWith("/jobs") ?? false;
  const isSourcesActive =
    pathname?.startsWith("/infrastructure/sources") ?? false;
  const isDestinationsActive =
    pathname?.startsWith("/infrastructure/destinations") ?? false;
  const isSettingsActive = pathname?.startsWith("/settings") ?? false;
  const isNotificationsActive = pathname?.startsWith("/notifications") ?? false;

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div>
            <h2
              className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
              }`}
            >
              {isExpanded || isHovered || isMobileOpen ? "Menu" : ""}
            </h2>
            <ul className="flex flex-col gap-4">
              <li>
                <Link
                  href="/"
                  className={`menu-item group ${
                    isDashboardActive ? "menu-item-active" : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`${
                      isDashboardActive
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    <GridIcon />
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">Dashboard</span>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  href="/jobs"
                  className={`menu-item group ${
                    isJobsActive ? "menu-item-active" : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`${
                      isJobsActive
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    <TaskIcon />
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">Jobs</span>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  href="/backups"
                  className={`menu-item group ${
                    isBackupsActive ? "menu-item-active" : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`${
                      isBackupsActive
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    <BoxCubeIcon />
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">Backups</span>
                  )}
                </Link>
              </li>
            </ul>
          </div>
          <div className="mt-8">
            <h2
              className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
              }`}
            >
              {isExpanded || isHovered || isMobileOpen ? "Infrastructure" : ""}
            </h2>
            <ul className="flex flex-col gap-4">
              <li>
                <Link
                  href="/infrastructure/sources"
                  className={`menu-item group ${
                    isSourcesActive ? "menu-item-active" : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`${
                      isSourcesActive
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    <PlugInIcon />
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">Sources</span>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  href="/infrastructure/destinations"
                  className={`menu-item group ${
                    isDestinationsActive
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`${
                      isDestinationsActive
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    <FolderIcon />
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">Destinations</span>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  href="/notifications"
                  className={`menu-item group ${
                    isNotificationsActive
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`${
                      isNotificationsActive
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    <BellIcon />
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">Notifications</span>
                  )}
                </Link>
              </li>
            </ul>
          </div>
          <div className="mt-8">
            <h2
              className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
              }`}
            >
              {isExpanded || isHovered || isMobileOpen ? "Settings" : ""}
            </h2>
            <ul className="flex flex-col gap-4">
              <li>
                <Link
                  href="/settings"
                  className={`menu-item group ${
                    isSettingsActive
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`${
                      isSettingsActive
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    <PlugInIcon />
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">Settings</span>
                  )}
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
