import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Close drawer whenever the route changes.
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  // Lock background scrolling and support Escape.
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080b13] text-white">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">
          <Sidebar />
        </aside>

        {/* Mobile navigation drawer */}
        {mobileMenuOpen && (
          <div className="sc-mobile-drawer fixed inset-0 z-[100] lg:hidden">
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={closeMobileMenu}
              className="sc-mobile-drawer-overlay absolute inset-0"
            />

            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Main navigation"
              className="sc-mobile-drawer-panel relative h-full w-[280px] max-w-[86vw]"
            >
              <button
                type="button"
                onClick={closeMobileMenu}
                className="sc-mobile-drawer-close"
                aria-label="Close menu"
              >
                <X size={19} />
              </button>

              <Sidebar onNavigate={closeMobileMenu} />
            </aside>
          </div>
        )}

        {/* Main application area */}
        <div className="min-w-0 flex-1">
          <Topbar onMenuClick={() => setMobileMenuOpen(true)} />

          <main className="sc-main-content mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}