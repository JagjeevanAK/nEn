import { Home } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/config/api";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { NavLink, useNavigate } from "react-router-dom";

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  
];

interface UserData {
  id: string;
  email: string;
  name?: string;
}

const getInitials = (name: string | undefined) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

const getRandomColor = (name: string | undefined) => {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
  ];
  if (!name) return colors[0];
  const charSum = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[charSum % colors.length];
};

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/v1/auth/me`, {
          withCredentials: true,
        });
        setUser(res.data.data);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  const handleProfile = () => {
    navigate("/profile");
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="hover:bg-[#f7f1e6]">
        <div className="flex justify-between ">
          <SidebarGroupLabel className="text-xl font-bold text-black ">nEn</SidebarGroupLabel>
          <SidebarTrigger className="ml-[-50px]" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url}>
                      {({ isActive }) => (
                        <>
                          <item.icon className={isActive ? "text-teal-500" : undefined} />
                          <span className={` ${isActive ? "text-teal-500" : ""}`}>{item.title}</span>
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <button
          onClick={handleProfile}
          className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getRandomColor(user?.name)}`}>
            {getInitials(user?.name)}
          </div>
          {state === "expanded" && (
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="font-medium text-sm truncate w-full">
                {user?.name || "User"}
              </span>
            </div>
          )}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}