import React from "react";

const TopLoader = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-[3px] z-[9999] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-blue-600 to-green-600 w-1/3"
        style={{
          animation: "progressSlide 1.2s ease-in-out infinite",
        }}
      />
    </div>
  );
};

export default TopLoader;