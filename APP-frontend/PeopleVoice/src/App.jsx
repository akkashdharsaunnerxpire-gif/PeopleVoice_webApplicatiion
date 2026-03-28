// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* ================= CONTEXT ================= */
import { UserValuesProvider } from "./Context/UserValuesContext";
import { ThemeProvider } from "./Context/ThemeContext";

/* ================= ROUTES ================= */
import AppRoutes from "./citizen/routes/AppRoutes";
import AdminRoutes from "./admin/routes/AdminRoutes";

const App = () => {
  return (
    <ThemeProvider>                    {/* Theme at the highest level */}
      <BrowserRouter>
        <Routes>
          {/* ================= CITIZEN APP ================= */}
          <Route
            path="/peopleVoice/*"
            element={
              <UserValuesProvider>
                <AppRoutes />
              </UserValuesProvider>
            }
          />

          {/* ================= ADMIN APP ================= */}
          <Route path="/admin/*" element={<AdminRoutes />} />

          {/* ================= DEFAULT REDIRECT ================= */}
          <Route path="/" element={<Navigate to="/peopleVoice" replace />} />

          {/* ================= 404 FALLBACK ================= */}
          <Route path="*" element={<Navigate to="/peopleVoice" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;