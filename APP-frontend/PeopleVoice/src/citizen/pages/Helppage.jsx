import React, { useState } from "react";
import {
  MapPin,
  Upload,
  Eye,
  MessageCircle,
  ThumbsUp,
  CheckCircle,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  ArrowLeft, // added back arrow icon
} from "lucide-react";
import { useTheme } from "../../Context/ThemeContext";
import { useNavigate } from "react-router-dom"; // for navigation

const HelpPage = () => {
  const { isDark } = useTheme();
  const [openFaq, setOpenFaq] = useState(null);
  const navigate = useNavigate();

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // FAQ – unchanged
  const faqs = [
    {
      question: "How do I report a new civic issue?",
      answer:
        "Click on 'Report New Issue' from your dashboard or the navigation menu. Fill in the title, description, category, upload an image (optional), and pin your location on the map. Submit the form – your issue will be visible to the community and authorities.",
    },
    {
      question: "Can I track the status of my complaint?",
      answer:
        "Yes. Go to 'My Complaints' in your profile. Each issue shows a status badge: 'Pending', 'In Progress', 'Resolved', or 'Rejected'. You'll also receive real-time updates via notifications.",
    },
    {
      question: "How do I interact with other users' issues?",
      answer:
        "On the main feed, click any issue card to open its detail page. You can add comments, like issues that matter to you, and share the issue.",
    },
    {
      question: "What happens after I report an issue?",
      answer:
        "Your issue is visible to everyone. Authorities can review it, update the status, and add remarks. You'll receive notifications when the status changes.",
    },
    {
      question: "Is my personal information safe?",
      answer:
        "Yes. Your private data is secure. Only your username and reported issues are visible publicly.",
    },
    {
      question: "How can I delete or edit my complaint?",
      answer:
        "You can manage your reports from 'My Issues'. Open your issue and use available options to delete it.",
    },
  ];

  const steps = [
    {
      icon: <Upload size={24} />,
      title: "1. Report",
      description: "Add photo, description & location.",
    },
    {
      icon: <Eye size={24} />,
      title: "2. Track",
      description: "See real‑time status updates.",
    },
    {
      icon: <MessageCircle size={24} />,
      title: "3. Engage",
      description: "Like & comment on issues.",
    },
    {
      icon: <CheckCircle size={24} />,
      title: "4. Resolve",
      description: "Get notified when fixed.",
    },
  ];

  const features = [
    {
      icon: <MapPin size={20} />,
      title: "Location Pin",
      desc: "Exact spot for faster action.",
    },
    {
      icon: <Upload size={20} />,
      title: "Photo Proof",
      desc: "Upload images to support.",
    },
    {
      icon: <Clock size={20} />,
      title: "Live Tracking",
      desc: "Status updates instantly.",
    },
    {
      icon: <ThumbsUp size={20} />,
      title: "Community Likes",
      desc: "Highlight important issues.",
    },
    {
      icon: <MessageCircle size={20} />,
      title: "Comments",
      desc: "Discuss with neighbours.",
    },
    {
      icon: <Globe size={20} />,
      title: "Public Feed",
      desc: "See all issues in one place.",
    },
  ];

  return (
    <div
      className={`min-h-screen py-6 px-3 transition-colors duration-300 ${
        isDark ? "bg-black/95" : "bg-gray-50"
      }`}
    >
      <div className="max-w-4xl mx-auto relative">
        <div
          className={`rounded-2xl shadow-xl p-5 sm:p-8 transition-all ${
            isDark
              ? "bg-gray-900/90 border border-gray-800 text-gray-100"
              : "bg-white border border-gray-200 text-gray-900"
          }`}
        >
          {/* Back Button - top left */}
          <button
            onClick={() => navigate(-1)} // go back to previous page
            className={`absolute top-5 left-5 sm:top-6 sm:left-6 p-2 rounded-full transition-all duration-200 ${
              isDark
                ? "hover:bg-gray-800 text-gray-300"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>

          {/* Header with short, scannable description */}
          <div className="text-center mb-8 mt-2">
            <div className="inline-flex items-center justify-center p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-full mb-4">
              <HelpCircle size={28} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2">How Can We Help?</h1>
            <div className="text-sm opacity-80 max-w-lg mx-auto space-y-1">
              <p>✅ Report civic issues with photo & location</p>
              <p>✅ Track status in real‑time</p>
              <p>✅ Like, comment & stay notified</p>
              <p>✅ Community-driven platform for better infrastructure</p>
            </div>
          </div>

          {/* Steps - more compact on mobile */}
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock size={20} className="text-emerald-500" />
              Quick Steps
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl text-center transition hover:scale-105 ${
                    isDark ? "bg-gray-800/50" : "bg-gray-50"
                  }`}
                >
                  <div className="text-emerald-500 mb-1 flex justify-center">
                    {step.icon}
                  </div>
                  <div className="font-semibold text-sm">{step.title}</div>
                  <div className="text-xs opacity-70 mt-1">{step.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Features - compact grid */}
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <CheckCircle size={20} className="text-emerald-500" />
              Key Features
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 p-2 rounded-lg text-sm ${
                    isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="text-emerald-500 shrink-0 mt-0.5">
                    {feature.icon}
                  </div>
                  <div>
                    <div className="font-medium">{feature.title}</div>
                    <div className="text-xs opacity-70">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ - unchanged content, cleaner spacing */}
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <HelpCircle size={20} className="text-emerald-500" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border ${
                    isDark ? "border-gray-800" : "border-gray-200"
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex justify-between items-center p-3 text-left text-sm font-medium"
                  >
                    <span>{faq.question}</span>
                    {openFaq === idx ? (
                      <ChevronUp size={16} className="text-emerald-500" />
                    ) : (
                      <ChevronDown size={16} className="opacity-60" />
                    )}
                  </button>
                  {openFaq === idx && (
                    <div
                      className={`p-3 pt-0 text-xs opacity-80 border-t ${
                        isDark ? "border-gray-800" : "border-gray-200"
                      }`}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs opacity-50 pt-2 border-t border-gray-200 dark:border-gray-800">
            Civic Voice — Better communities together
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;