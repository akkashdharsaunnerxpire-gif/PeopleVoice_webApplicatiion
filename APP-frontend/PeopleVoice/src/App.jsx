import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* ================= CONTEXT ================= */
import { UserValuesProvider } from "./Context/UserValuesContext";
import { ThemeProvider } from "./Context/ThemeContext"; // ✅ NEW: Theme Provider

/* ================= ROUTES ================= */
import AppRoutes from "./citizen/routes/AppRoutes";
import AdminRoutes from "./admin/routes/AdminRoutes";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= CITIZEN APP ================= */}
        <Route
          path="/peopleVoice/*"
          element={
            <ThemeProvider>           {/* ✅ Wrap with ThemeProvider */}
              <UserValuesProvider>
                <AppRoutes />
              </UserValuesProvider>
            </ThemeProvider>
          }
        />

        {/* ================= ADMIN APP ================= */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* ================= DEFAULT ================= */}
        <Route path="/" element={<Navigate to="/peopleVoice" replace />} />

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/peopleVoice" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
