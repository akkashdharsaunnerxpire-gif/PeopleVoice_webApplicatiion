import React from "react";

/*
  Props:
  - status: "Sent" | "Viewed" | "Pending" | "Resolved" | "No Response"
*/

const STATUS_STYLES = {
  Sent: "bg-blue-100 text-blue-700",
  Viewed: "bg-purple-100 text-purple-700",
  Pending: "bg-yellow-100 text-yellow-800",
  Resolved: "bg-green-100 text-green-700",
  "No Response": "bg-red-100 text-red-700",
};

const StatusBadge = ({ status = "Sent" }) => {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
        STATUS_STYLES[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
