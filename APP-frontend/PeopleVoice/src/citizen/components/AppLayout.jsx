import { Navigate, Outlet, useLocation } from "react-router-dom";
import Navigation from "../components/Navigation";
import CommentModal from "../components/CommentModal";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

const AppLayout = () => {
  const location = useLocation();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const [isDark, setIsDark] = useState(
    localStorage.getItem("theme") === "dark"
  );

  // Disable zooming (optional, keeps pinch zoom off)
  useEffect(() => {
    let metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) {
      metaViewport = document.createElement("meta");
      metaViewport.name = "viewport";
      document.head.appendChild(metaViewport);
    }
    metaViewport.setAttribute(
      "content",
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
    );
    return () => {
      if (metaViewport) {
        metaViewport.setAttribute(
          "content",
          "width=device-width, initial-scale=1.0"
        );
      }
    };
  }, []);

  // Sync theme with localStorage & document class
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

  // Global scroll style – clean & invisible scrollbar
  const scrollbarStyle = `
    * {
      scroll-behavior: smooth;
      scrollbar-width: thin;
    }
    *::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    *::-webkit-scrollbar-track {
      background: transparent;
    }
    *::-webkit-scrollbar-thumb {
      background-color: ${isDark ? "#4b5563" : "#cbd5e1"};
      border-radius: 20px;
    }
    *::-webkit-scrollbar-thumb:hover {
      background-color: ${isDark ? "#6b7280" : "#94a3b8"};
    }
  `;

  return (
    <div
      className={`min-h-screen w-full transition-all duration-500 ${
        isDark ? "bg-[#1a0033] text-violet-50" : "bg-white text-gray-900"
      }`}
    >
      <style>{scrollbarStyle}</style>

      <div className="relative flex">
        {isLoggedIn && <Navigation />}

        <main className={`flex-1 w-full min-h-screen ${isLoggedIn ? "md:ml-72" : ""}`}>
          {/* Single Outlet – context passed directly */}
          <Outlet context={{ setCommentModalData, isDark }} />
        </main>

        <AnimatePresence>
          {commentModalData && (
            <CommentModal
              open={true}
              onClose={() => setCommentModalData(null)}
              issueId={commentModalData.issueId}
              comments={commentModalData.comments}
              images={
                commentModalData.hideImage
                  ? []
                  : commentModalData.images || commentModalData.images_data
              }
              citizenId={localStorage.getItem("citizenId")}
              postOwnerId={commentModalData.postOwnerId}
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