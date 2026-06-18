import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { ClientSidebar } from "./ClientSidebar";
import { TopBar } from "./TopBar";

export function ClientLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Set initial collapse state based on viewport width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
      // Close mobile drawer on desktop resize
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };

    // Set initial size
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      {/* Client Sidebar */}
      <ClientSidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      
      {/* Mobile Drawer Backdrop overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)} />
        <main className="flex-1 p-6 overflow-y-auto bg-[#F8FAFC]">
          <div className="max-w-[1400px] mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
