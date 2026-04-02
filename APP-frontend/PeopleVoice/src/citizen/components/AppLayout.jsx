import { Navigate, Outlet, useLocation } from "react-router-dom";
import Navigation from "../components/Navigation";
import CommentModal from "../components/CommentModal";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

const AppLayout = () => {
  const location = useLocation();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const [isDark, setIsDark] = useState(localStorage.getItem("theme") === "dark");

  // Disable zooming by setting viewport meta tag
  useEffect(() => {
    let metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) {
      metaViewport = document.createElement('meta');
      metaViewport.name = 'viewport';
      document.head.appendChild(metaViewport);
    }
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    
    // Cleanup on unmount (optional: restore original content if needed)
    return () => {
      // Restore default zoom behavior when component unmounts
      if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, []);

  useEffect(() => {
    const handleThemeUpdate = () => {
      const currentTheme = localStorage.getItem("theme") === "dark";
      setIsDark(currentTheme);
      document.documentElement.classList.toggle("dark", currentTheme);
    };
    window.addEventListener("storage", handleThemeUpdate);
    handleThemeUpdate();
    return () => window.removeEventListener("storage", handleThemeUpdate);
  }, []);

  const [commentModalData, setCommentModalData] = useState(null);
  const publicRoutes = ["/peopleVoice/login", "/peopleVoice/register"];

  useEffect(() => {
    document.body.style.overflow = commentModalData ? "hidden" : "";
  }, [commentModalData]);

  if (!isLoggedIn && !publicRoutes.includes(location.pathname)) {
    return <Navigate to="/peopleVoice/login" replace />;
  }

  return (
    <div
      className={`min-h-screen w-full transition-all duration-500 ${
        isDark ? "bg-[#1a0033] text-violet-50" : "bg-white text-gray-900"
      }`}
    >
      <div className="relative flex">
        {/* Sidebar – visible from md breakpoint (≥768px) */}
        {isLoggedIn && <Navigation />}

        {/* Main content – margin only when sidebar is visible */}
        <main
          className={`flex-1 w-full min-h-screen ${
            isLoggedIn ? "md:ml-72" : ""
          }`}
        >
          <Outlet context={{ setCommentModalData, isDark }} />
        </main>

        <AnimatePresence>
          {commentModalData && (
            <CommentModal
              open={true} 
              onClose={() => setCommentModalData(null)}
              issueId={commentModalData._id}
              comments={commentModalData.comments}
              images={commentModalData.images_data}
              citizenId={localStorage.getItem("citizenId")}
              postOwnerId={commentModalData.citizenId}
              district={commentModalData.district}
              setDisplayedIssues={commentModalData.setDisplayedIssues}
              isDark={isDark}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AppLayout;