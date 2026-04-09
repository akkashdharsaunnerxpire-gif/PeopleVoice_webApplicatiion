import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";

// Pages
import Login from "../pages/Login";
import Register from "../pages/Register";
import Feed from "../pages/Feed";
import PostIssue from "../pages/PostIssue";
import Profile from "../pages/Profile";
import Notifications from "../pages/Notifications";
import SavedIssues from "../pages/SavedIssues"; // ✅ FIX
import ForgotPassword from "../pages/Forgetpassword";
import MyIssues from "../pages/myissues";
import Settings from "../pages/Settings"
import Helpcare from "../pages/Helpcare";

// src/citizen/routes/AppRoutes.jsx

const AppRoutes = () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  return (
    
    
    <Routes>
      {/* ROOT: Using absolute path to /peopleVoice/feed */}
      <Route
        index
        element={<Navigate to={isLoggedIn ? "/peopleVoice/feed" : "/peopleVoice/login"} replace />}
      />

      {/* PUBLIC */}
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="forgotpassword" element={<ForgotPassword/>}/>

      {/* PROTECTED */}
      <Route element={<AppLayout />}>
        <Route path="feed" element={<Feed />} />
        
        {/* FIX: Changed "myissues" to "my-issues" to match your Navigation.jsx */}
        <Route path="my-issues" element={<MyIssues />} /> 
        
        <Route path="post-issue" element={<PostIssue />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="saved" element={<SavedIssues />} />
        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<Helpcare />} />
      </Route>

     
      <Route path="*" element={<Navigate to="/peopleVoice/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
