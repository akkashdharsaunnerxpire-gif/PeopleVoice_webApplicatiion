import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

// Pages
import Login from "../pages/Login";
import Register from "../pages/Register";
import Feed from "../pages/Feed";
import PostIssue from "../pages/PostIssue";
import Profile from "../pages/Profile";
import Notifications from "../pages/Notifications";
import SavedIssues from "../pages/SavedIssues";
import ForgotPassword from "../pages/Forgetpassword";
import MyIssues from "../pages/myissues";
import Settings from "../pages/Settings";
import Helpcare from "../pages/Helpcare";
import Proofpop from "../pages/Proofpop";
import Proofpage from "../pages/Proofspage";
import ResolutionReview from "../pages/ResolutionReview";
import NProgress from "../../utils/nprogress";


const AppRoutes = () => {
  const location = useLocation();
  useEffect(() => {
    NProgress.start();

    const timer = setTimeout(() => {
      NProgress.done();
    }, 800); // 🔥 800ms slow feel

    return () => clearTimeout(timer);
  }, [location]);
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  return (
    <Routes>
      {/* ROOT */}
      <Route
        index
        element={
          <Navigate
            to={isLoggedIn ? "/peopleVoice/feed" : "/peopleVoice/login"}
            replace
          />
        }
      />

      {/* PUBLIC ROUTES */}
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="forgotpassword" element={<ForgotPassword />} />
      <Route path="proofpop/:id" element={<Proofpop />} />
      <Route path="resolution-review/:id" element={<ResolutionReview />} />

      {/* PROTECTED ROUTES (with AppLayout) */}
      <Route element={<AppLayout />}>
        <Route path="feed" element={<Feed />} />
        <Route path="my-issues" element={<MyIssues />} />
        <Route path="post-issue" element={<PostIssue />} />
        <Route path="profile" element={<Profile />} />
        <Route path="proofspage" element={<Proofpage />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="saved" element={<SavedIssues />} />
        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<Helpcare />} />
      </Route>

      {/* CATCH ALL */}
      <Route path="*" element={<Navigate to="/peopleVoice/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
