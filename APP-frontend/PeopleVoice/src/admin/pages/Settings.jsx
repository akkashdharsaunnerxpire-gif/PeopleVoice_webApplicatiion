import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  HelpCircle,
  FileText,
  Bell,
  User,
  Lock,
  Globe,
  Mail,
  Phone,
  MapPin,
  Database,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Moon,
  Sun,
  Laptop,
  Smartphone,
  Eye,
  EyeOff,
  Save,
  X,
  Users,
  MessageSquare,
  Star,
  Award,
  Clock,
  Calendar,
  Printer,
  Share2,
  Link,
  QrCode,
  Fingerprint,
  Key,
  ShieldCheck,
  Heart,
  Gift,
  Sparkles,
  Zap,
  Plus,
  Minus,
  Info,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Admin info
  const adminName = localStorage.getItem('adminName') || 'District Admin';
  const adminDistrict = localStorage.getItem('adminDistrict') || 'Kanniyakumari';
  const adminEmail = localStorage.getItem('adminEmail') || 'admin@example.com';

  // Tab items
  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'about', label: 'About', icon: Info },
  ];

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Help articles
  const helpArticles = [
    { title: "How to update issue status?", icon: Clock, link: "#" },
    { title: "Managing citizen complaints", icon: MessageSquare, link: "#" },
    { title: "Understanding district points system", icon: Award, link: "#" },
    { title: "Generating resolution reports", icon: FileText, link: "#" },
    { title: "Contacting support team", icon: HeadsetIcon, link: "#" },
  ];

  // Features list
  const features = [
    { name: "Issue Tracking System", description: "Track and manage citizen complaints", status: "active", icon: FileText },
    { name: "Real-time Notifications", description: "Instant updates for status changes", status: "active", icon: Bell },
    { name: "District Leaderboard", description: "Compare district performance", status: "active", icon: Award },
    { name: "PDF Resolution Reports", description: "Generate professional reports", status: "active", icon: Download },
    { name: "Achievement Gallery", description: "Save resolved issues as proofs", status: "active", icon: Trophy },
    { name: "Multi-language Support", description: "Tamil and English interface", status: "active", icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
              Admin Settings
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 ml-1">
            Manage your account preferences and system configurations
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden sticky top-24">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {adminName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{adminName}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{adminDistrict} District</p>
                  </div>
                </div>
              </div>
              
              <div className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <tab.icon size={18} />
                    <span className="font-medium text-sm">{tab.label}</span>
                    {activeTab === tab.id && <ChevronRight size={16} className="ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <User size={20} className="text-blue-600" />
                    Profile Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                      <input type="text" value={adminName} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 cursor-not-allowed" disabled />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                      <input type="email" value={adminEmail} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 cursor-not-allowed" disabled />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">District</label>
                      <input type="text" value={adminDistrict} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 cursor-not-allowed" disabled />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                      <div className="px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 inline-block text-sm font-medium">
                        District Administrator
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <Globe size={20} className="text-blue-600" />
                    Preferences
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">Language</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred language</p>
                      </div>
                      <select className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                        <option>English</option>
                        <option>தமிழ் (Tamil)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">Theme</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Light / Dark / System</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                          <Sun size={18} />
                        </button>
                        <button className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                          <Moon size={18} />
                        </button>
                        <button className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                          <Laptop size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-blue-600" />
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <RefreshCw size={18} className="text-blue-600" />
                      <span className="text-sm">Refresh Dashboard</span>
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <Download size={18} className="text-green-600" />
                      <span className="text-sm">Export Reports</span>
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <Printer size={18} className="text-purple-600" />
                      <span className="text-sm">Print Summary</span>
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <Share2 size={18} className="text-orange-600" />
                      <span className="text-sm">Share Report</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <Lock size={20} className="text-blue-600" />
                    Change Password
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 pr-10" />
                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                          {showPassword ? <EyeOff size={18} className="text-gray-500" /> : <Eye size={18} className="text-gray-500" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                      <input type="password" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                      <input type="password" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" />
                    </div>
                    <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <Fingerprint size={20} className="text-blue-600" />
                    Two-Factor Authentication
                  </h2>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Enable 2FA</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account</p>
                    </div>
                    <button className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                      Setup
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <Key size={20} className="text-blue-600" />
                    Session Management
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">Current Session</p>
                        <p className="text-xs text-gray-500">Chrome on Windows • Active now</p>
                      </div>
                      <button className="text-red-500 text-sm">Logout</button>
                    </div>
                    <button className="text-blue-600 text-sm flex items-center gap-1">
                      <LogoutIcon size={14} /> Logout all other devices
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <Bell size={20} className="text-blue-600" />
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  {[
                    { label: "New Issue Reports", desc: "Get notified when citizens submit new issues", enabled: true },
                    { label: "Status Updates", desc: "Receive updates when issue status changes", enabled: true },
                    { label: "Escalated Issues", desc: "Important issues that need attention", enabled: true },
                    { label: "System Announcements", desc: "Platform updates and maintenance", enabled: false },
                    { label: "Email Digest", desc: "Daily/weekly summary of activities", enabled: false },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">{item.label}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                      </div>
                      <button className={`w-12 h-6 rounded-full transition-all ${item.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full transition-all ${item.enabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Management */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <Database size={20} className="text-blue-600" />
                    Data Import/Export
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <Download size={18} className="text-green-600" />
                      <div className="text-left">
                        <p className="font-medium">Export Data</p>
                        <p className="text-xs text-gray-500">JSON / CSV format</p>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <Upload size={18} className="text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium">Import Data</p>
                        <p className="text-xs text-gray-500">Restore from backup</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <Trash2 size={20} className="text-red-500" />
                    Danger Zone
                  </h2>
                  <div className="border border-red-200 dark:border-red-800 rounded-xl p-4 bg-red-50 dark:bg-red-950/20">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="font-medium text-red-700 dark:text-red-400">Clear All Data</p>
                        <p className="text-sm text-red-600 dark:text-red-500">This action cannot be undone</p>
                      </div>
                      <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                        Clear Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Help & Support */}
            {activeTab === 'help' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <HelpCircle size={20} className="text-blue-600" />
                    Help Articles
                  </h2>
                  <div className="space-y-2">
                    {helpArticles.map((article, idx) => (
                      <a key={idx} href={article.link} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <div className="flex items-center gap-3">
                          <article.icon size={18} className="text-gray-500" />
                          <span className="text-gray-700 dark:text-gray-300">{article.title}</span>
                        </div>
                        <ExternalLink size={16} className="text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <Mail size={20} className="text-blue-600" />
                    Contact Support
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <Mail size={18} className="text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Email Support</p>
                        <p className="text-xs text-gray-500">support@peoplevoice.gov.in</p>
                      </div>
                      <button onClick={() => copyToClipboard('support@peoplevoice.gov.in')} className="ml-auto text-blue-600 text-sm">
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <Phone size={18} className="text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Helpline</p>
                        <p className="text-xs text-gray-500">1800-123-4567 (Toll Free)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                  <h3 className="text-lg font-semibold mb-2">Need immediate assistance?</h3>
                  <p className="text-blue-100 text-sm mb-4">Our support team is available 24/7</p>
                  <button className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium">Contact Support</button>
                </div>
              </div>
            )}

            {/* Privacy Policy */}
            {activeTab === 'privacy' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-blue-600" />
                  Privacy & Security
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-400 text-sm">
                  <p>• Your district data is encrypted and securely stored</p>
                  <p>• Citizen information is protected under Data Protection Act</p>
                  <p>• All issue reports are anonymized for analysis</p>
                  <p>• Access logs are maintained for security audits</p>
                  <p>• Data retention period: 7 years as per government regulations</p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-gray-500">Last updated: April 2026</p>
                  <button className="mt-2 text-blue-600 text-sm">View Full Privacy Policy →</button>
                </div>
              </div>
            )}

            {/* About */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl text-white font-bold">PV</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">PeopleVoice</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Version 2.0.0</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-4 max-w-md mx-auto">
                    Empowering citizens to voice their concerns and enabling efficient grievance redressal
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">System Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1"><span className="text-gray-500">Platform</span><span>Web Application</span></div>
                    <div className="flex justify-between py-1"><span className="text-gray-500">Framework</span><span>React + Node.js</span></div>
                    <div className="flex justify-between py-1"><span className="text-gray-500">Database</span><span>MongoDB</span></div>
                    <div className="flex justify-between py-1"><span className="text-gray-500">Build Date</span><span>{new Date().toLocaleDateString()}</span></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Acknowledgments</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">Made in India</span>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">Digital India Initiative</span>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">Open Source</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Confirm Action</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to clear all data? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Yes, Clear Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper icon components
const HeadsetIcon = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" />
  </svg>
);

const LogoutIcon = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const Trophy = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export default Settings;