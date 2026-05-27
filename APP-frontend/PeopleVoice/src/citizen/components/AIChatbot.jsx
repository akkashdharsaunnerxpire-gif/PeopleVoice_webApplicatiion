import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  ChevronDown,
} from "lucide-react";

import axios from "axios";
const API  = import.meta.env.VITE_BACKEND_URL || "";

const AIChatbot = ({ isDark }) => {
  const [open, setOpen] = useState(false);

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "👋 Hi! I'm PeopleVoice AI",
    },
  ]);

  // Auto Scroll Refs
  const messagesEndRef = useRef(null);

  const messagesContainerRef = useRef(null);

  const [showScrollBottom, setShowScrollBottom] =
    useState(false);

  // Auto Scroll When Message Comes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // Detect Scroll Position
  const handleScroll = () => {
    const container =
      messagesContainerRef.current;

    if (!container) return;

    const isBottom =
      container.scrollHeight -
        container.scrollTop <=
      container.clientHeight + 100;

    setShowScrollBottom(!isBottom);
  };

  // Send Message
  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      sender: "user",
      text: message,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setMessage("");

    try {
      const res = await axios.post(
        `${API}/api/ai/chat`,
        {
          message,
        },
      );

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: res.data.reply,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "⚠️ AI unavailable",
        },
      ]);
    }
  };

  return (
    <>
      {/* Floating AI Trigger */}
      <div
        className="
          fixed
          bottom-24
          right-4

          md:bottom-5
          md:right-5

          z-[999]
          flex
          items-end
          gap-3
        "
      >
        {/* Robot Assistant */}
        {!open && (
          <div className="hidden sm:flex items-center gap-3 animate-slideIn">
            <div
              className={`
                flex items-center gap-3
                px-4 py-3
                rounded-2xl
                shadow-xl
                border
                backdrop-blur-xl
                animate-float

                ${
                  isDark
                    ? "bg-[#26263d]/95 border-gray-700"
                    : "bg-white/95 border-gray-200"
                }
              `}
            >
              {/* Robot Avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl shadow-lg">
                  🤖
                </div>

                {/* Online Dot */}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
              </div>

              {/* Text */}
              <div>
                <h3
                  className={`text-sm font-semibold ${
                    isDark
                      ? "text-white"
                      : "text-gray-800"
                  }`}
                >
                  PeopleVoice AI
                </h3>

                <p
                  className={`text-xs ${
                    isDark
                      ? "text-gray-300"
                      : "text-gray-500"
                  }`}
                >
                  Ask me anything...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Floating Button */}
        <button
          onClick={() => setOpen(!open)}
          className="
            group
            relative
            bg-gradient-to-r
            from-green-500
            to-emerald-600

            hover:scale-110
            active:scale-95

            text-white
            p-4
            rounded-full

            shadow-[0_10px_40px_rgba(34,197,94,0.45)]

            transition-all
            duration-300
          "
        >
          {/* Pulse Animation */}
          {!open && (
            <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20"></span>
          )}

          <div className="relative z-10">
            {open ? (
              <X size={22} />
            ) : (
              <MessageCircle size={22} />
            )}
          </div>
        </button>
      </div>

      {/* Chat Window */}
      {open && (
        <div
          className={`
            fixed z-[999]

            bottom-40
            right-4

            md:bottom-24
            md:right-5

            flex flex-col
            overflow-hidden

            w-[92vw]
            max-w-[370px]

            h-[70vh]
            max-h-[600px]

            rounded-[2rem]

            shadow-[0_20px_60px_rgba(0,0,0,0.25)]

            border
            backdrop-blur-2xl

            animate-chatOpen

            ${
              isDark
                ? "bg-[#1f1f35]/95 border-gray-700"
                : "bg-white/95 border-gray-200"
            }
          `}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                🤖 PeopleVoice AI
              </h2>

              <p className="text-xs text-green-100">
                Online now
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="hover:bg-white/20 p-2 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="
              flex-1
              overflow-y-auto
              p-4
              space-y-3
              relative
            "
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`
                  max-w-[85%]
                  px-4
                  py-3
                  rounded-2xl
                  text-sm
                  leading-relaxed
                  animate-fadeIn
                  break-words

                  ${
                    msg.sender === "user"
                      ? `
                        ml-auto
                        bg-green-600
                        text-white
                        rounded-br-md
                      `
                      : isDark
                        ? `
                          bg-gray-700
                          text-white
                          rounded-bl-md
                        `
                        : `
                          bg-gray-100
                          text-black
                          rounded-bl-md
                        `
                  }
                `}
              >
                {msg.text}
              </div>
            ))}

            {/* Scroll Ref */}
            <div ref={messagesEndRef}></div>

            {/* Scroll Bottom Button */}
            {showScrollBottom && (
              <button
                onClick={() =>
                  messagesEndRef.current?.scrollIntoView(
                    {
                      behavior: "smooth",
                    },
                  )
                }
                className={`
                  absolute
                  bottom-4
                  right-4

                  w-11
                  h-11

                  rounded-full
                  shadow-2xl

                  flex
                  items-center
                  justify-center

                  animate-bounce

                  transition-all
                  duration-300

                  hover:scale-110

                  ${
                    isDark
                      ? `
                        bg-[#2b2b45]
                        border
                        border-gray-700
                        text-white
                      `
                      : `
                        bg-white/95
                        backdrop-blur-xl
                        border
                        border-gray-200
                        text-gray-700
                      `
                  }
                `}
              >
                <ChevronDown size={20} />
              </button>
            )}
          </div>

          {/* Input */}
          <div
            className={`
              p-3
              border-t
              flex
              gap-2

              ${
                isDark
                  ? "border-gray-700"
                  : "border-gray-200"
              }
            `}
          >
            <input
              type="text"
              placeholder="Ask something..."
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" &&
                sendMessage()
              }
              className={`
                flex-1
                px-4
                py-3
                rounded-2xl
                outline-none
                text-sm

                ${
                  isDark
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-black"
                }
              `}
            />

            <button
              onClick={sendMessage}
              className="
                bg-green-600
                hover:bg-green-700
                active:scale-95

                text-white

                p-3
                rounded-2xl

                transition-all
                duration-300
              "
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;