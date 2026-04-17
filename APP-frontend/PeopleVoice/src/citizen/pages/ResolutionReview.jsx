import React, { useState, useEffect } from "react";

const Settings = () => {
  const [currentAdmin, setCurrentAdmin] = useState({
    name: "District Admin",
    email: "admin@gov.in",
    role: "Super Admin",
  });

  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    role: "Admin",
  });

  /* LOAD */
  useEffect(() => {
    const savedAdmins = localStorage.getItem("admins");
    const savedCurrent = localStorage.getItem("currentAdmin");

    if (savedAdmins) setAdmins(JSON.parse(savedAdmins));
    if (savedCurrent) setCurrentAdmin(JSON.parse(savedCurrent));
  }, []);

  /* SAVE */
  const saveAdmins = (data) => {
    setAdmins(data);
    localStorage.setItem("admins", JSON.stringify(data));
  };

  /* ADD ADMIN */
  const addAdmin = () => {
    if (!newAdmin.name || !newAdmin.email) {
      alert("Enter details");
      return;
    }

    const updated = [...admins, { ...newAdmin, active: true }];
    saveAdmins(updated);

    setNewAdmin({ name: "", email: "", role: "Admin" });
  };

  /* TRANSFER ADMIN 🔥 */
  const makeAdminActive = (admin) => {
    // deactivate old
    const updated = admins.map((a) => ({
      ...a,
      active: false,
    }));

    // set new current
    setCurrentAdmin(admin);
    localStorage.setItem("currentAdmin", JSON.stringify(admin));

    saveAdmins(updated);
    alert("✅ Admin transferred successfully");
  };

  /* DELETE ADMIN */
  const deleteAdmin = (index) => {
    const updated = admins.filter((_, i) => i !== index);
    saveAdmins(updated);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-6">

        {/* CURRENT ADMIN */}
        <div className="mb-6">
          <h2 className="text-xl font-bold">👤 Current Admin</h2>
          <div className="mt-2 p-3 bg-green-50 rounded">
            <p><b>Name:</b> {currentAdmin.name}</p>
            <p><b>Email:</b> {currentAdmin.email}</p>
            <p><b>Role:</b> {currentAdmin.role}</p>
          </div>
        </div>

        {/* ADD ADMIN */}
        <div className="mb-6">
          <h2 className="font-semibold mb-2">➕ Add New Admin</h2>

          <div className="grid md:grid-cols-3 gap-3">
            <input
              placeholder="Name"
              value={newAdmin.name}
              onChange={(e) =>
                setNewAdmin({ ...newAdmin, name: e.target.value })
              }
              className="border p-2 rounded"
            />

            <input
              placeholder="Email"
              value={newAdmin.email}
              onChange={(e) =>
                setNewAdmin({ ...newAdmin, email: e.target.value })
              }
              className="border p-2 rounded"
            />

            <select
              value={newAdmin.role}
              onChange={(e) =>
                setNewAdmin({ ...newAdmin, role: e.target.value })
              }
              className="border p-2 rounded"
            >
              <option>Admin</option>
              <option>Super Admin</option>
            </select>
          </div>

          <button
            onClick={addAdmin}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Add Admin
          </button>
        </div>

        {/* ADMIN LIST */}
        <div>
          <h2 className="font-semibold mb-3">👥 Admin List</h2>

          {admins.map((admin, i) => (
            <div
              key={i}
              className="flex justify-between items-center border-b py-2"
            >
              <div>
                <p className="font-medium">{admin.name}</p>
                <p className="text-sm text-gray-500">{admin.email}</p>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                  {admin.role}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => makeAdminActive(admin)}
                  className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                >
                  Make Active
                </button>

                <button
                  onClick={() => deleteAdmin(i)}
                  className="text-red-500 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Settings;