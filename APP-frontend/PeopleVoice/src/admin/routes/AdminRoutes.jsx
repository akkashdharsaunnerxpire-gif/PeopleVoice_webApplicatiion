import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import AdminLayout from "../components/AdminLayout.jsx";
import AdminLogin from "../pages/AdminLogin";
import Dashboard from "../pages/Dashboard";
import Issues from "../pages/Issues";
import IssueDetails from "../pages/IssueDetails";
import ReviewPage from "../pages/ReviewPage";
import Departments from "../pages/Departments";
import Settings from "../pages/Settings";
import AdminRegister from "../pages/AdminRegister.jsx";
import AdminForgotPassword from "../pages/AdminForgotPassword.jsx";
import TopLoader from "../components/TopLoader";

const AdminRoutes = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [location]);

  return (
    <>
      {loading && <TopLoader />}

      <Routes>
        {/* PUBLIC */}
        <Route path="login" element={<AdminLogin />} />
        <Route path="register" element={<AdminRegister />} />
        <Route path="forgot-password" element={<AdminForgotPassword />} />

        {/* PROTECTED */}
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/issues" element={<Issues />} />
          <Route path="dashboard/issues/:id" element={<IssueDetails />} />
          <Route path="dashboard/review" element={<ReviewPage />} />
          <Route path="dashboard/departments" element={<Departments />} />
          <Route path="dashboard/settings" element={<Settings />} />
        </Route>
      </Routes>
    </>
  );
};

export default AdminRoutes;