import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, LogOut, X } from 'lucide-react';

const LogoutConfirmModal = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Decorative top gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-red-600" />

            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-full">
                  <AlertTriangle className="text-red-600" size={22} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Logout</h3>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 pb-4">
              <p className="text-gray-600 text-base leading-relaxed">
                Are you sure you want to logout? You will need to login again to access the admin panel.
              </p>
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 p-5 pt-2 bg-gray-50/50">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:from-red-700 hover:to-red-800 shadow-sm hover:shadow disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut size={18} />
                    <span>Yes, Logout</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default LogoutConfirmModal;