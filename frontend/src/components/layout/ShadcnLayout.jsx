import { FiLogOut } from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom"; // If you need to redirect after logout
import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiHome,
  FiCheckCircle,
  FiBook,
  FiSettings,
  FiFileText,
  FiUsers,
  FiBarChart2,
  FiClock,
  FiUser,
  FiUserPlus,
} from "react-icons/fi";
import logo from "@/assets/images/logo.png";

// Navigation structure based on _nav.jsx
const navigationItems = [
  {
    name: "Dashboard",
    path: "/secure-sehan-admin/dashboard",
    icon: FiHome,
  },
  {
    name: "Homework",
    icon: FiBook,
    children: [
      { name: "Create", path: "/secure-sehan-admin/homework/create" },
      { name: "Grade", path: "/secure-sehan-admin/homework/grade" },
    ],
  },
  {
    name: "Attendance",
    icon: FiCheckCircle,
    children: [
      { name: "Code", path: "/secure-sehan-admin/attendance/code" },
      { name: "Info", path: "/secure-sehan-admin/attendance/info" },
    ],
  },
  {
    name: "Tables",
    icon: FiBarChart2,
    children: [{ name: "Scores", path: "/secure-sehan-admin/scores" }],
  },
  {
    name: "Settings",
    icon: FiSettings,
    children: [
      { name: "Timetable", path: "/secure-sehan-admin/settings/timetable" },
      { name: "Students", path: "/secure-sehan-admin/settings/students" },
      { name: "Teachers", path: "/secure-sehan-admin/settings/teachers" },
      { name: "Parents", path: "/secure-sehan-admin/settings/parents" },
      { name: "Parent-Student", path: "/secure-sehan-admin/settings/parent-student" },
      { name: "Configuration", path: "/secure-sehan-admin/settings/config" },
    ],
  },
  {
    name: "Report",
    icon: FiFileText,
    children: [
      { name: "Comment", path: "/secure-sehan-admin/report/comments" },
      { name: "Management", path: "/secure-sehan-admin/report/management" },
    ],
  },
];


const SidebarNavItem = ({ item, isCollapsed }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const isActive = item.path && location.pathname === item.path;

  const ItemContent = () => (
    <>
      <Icon className="w-5 h-5 shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1 text-left">{item.name}</span>
          {hasChildren && (
            <div className="shrink-0">
              {isExpanded ? (
                <FiChevronDown className="w-4 h-4" />
              ) : (
                <FiChevronRight className="w-4 h-4" />
              )}
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <div className="w-full">
      {hasChildren ? (
        <button
          onClick={handleClick}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            "hover:bg-accent hover:text-accent-foreground",
            "text-sm font-medium text-muted-foreground",
            "group"
          )}
        >
          <ItemContent />
        </button>
      ) : (
        <Link
          to={item.path}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            "hover:bg-accent hover:text-accent-foreground",
            "text-sm font-medium",
            "group",
            isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
          )}
        >
          <ItemContent />
        </Link>
      )}

      {/* Children/Submenu items */}
      {hasChildren && isExpanded && !isCollapsed && (
        <div className="mt-1 ml-8 space-y-1">
          {item.children?.map((child) => {
            const isChildActive = location.pathname === child.path;
            return (
              <Link
                key={child.path}
                to={child.path}
                className={cn(
                  "block px-3 py-2 rounded-md text-sm",
                  "hover:text-foreground hover:bg-accent/50 transition-colors",
                  isChildActive ? "text-foreground bg-accent/50 font-medium" : "text-muted-foreground"
                )}
              >
                {child.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ShadcnLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. Initialize hooks
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // 2. Define the Logout Action
  const handleLogout = () => {
    // Navigate to the logout route.
    // We pass 'state' so your Logout component knows we came from admin pages
    navigate("/logout", { 
      state: { from: location.pathname } 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 gap-4">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? (
              <FiX className="h-5 w-5" />
            ) : (
              <FiMenu className="h-5 w-5" />
            )}
          </Button>

          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={toggleSidebar}
          >
            <FiMenu className="h-5 w-5" />
          </Button>

          {/* Logo and title */}
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-8 w-auto" />
            <span className="font-semibold text-lg hidden sm:inline-block">
              Admin Dashboard
            </span>
          </div>

          {/* Header actions */}
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <FiUser className="h-5 w-5" />
                  <span className="sr-only">Open user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <FiUser className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FiSettings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* 3. The Logout Trigger */}
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <FiLogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300 hidden md:block",
          isSidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <ScrollArea className="h-full py-4">
          <nav className="flex flex-col gap-1 px-2">
            {navigationItems.map((item) => (
              <SidebarNavItem
                key={item.name}
                item={item}
                isCollapsed={isSidebarCollapsed}
              />
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* Sidebar - Mobile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={toggleMobileMenu}
          />
          {/* Sidebar */}
          <aside className="absolute left-0 top-16 bottom-0 w-64 border-r bg-background">
            <ScrollArea className="h-full py-4">
              <nav className="flex flex-col gap-1 px-2">
                {navigationItems.map((item) => (
                  <SidebarNavItem
                    key={item.name}
                    item={item}
                    isCollapsed={false}
                  />
                ))}
              </nav>
            </ScrollArea>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main
        className={cn(
          "pt-16 transition-all duration-300",
          "md:pl-64",
          isSidebarCollapsed && "md:pl-16"
        )}
      >
        <div className="container mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ShadcnLayout;
