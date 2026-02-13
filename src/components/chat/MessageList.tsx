// src/components/chat/MessageList.tsx
import React from "react";
import { motion } from "framer-motion";
import { User, ShieldAlert, Check, Image } from "lucide-react";

interface Message {
  id: number;
  sender: string;
  text: string;
  timestamp: string;
  avatar?: string;
  fileUrl?: string;
  read?: boolean;
  reported?: boolean;
  typing?: boolean;
}

interface MessageListProps {
  messages: Message[];
  onReport: (id: number) => void;
  typingUser?: string;
  currentUser: string;
}

const MessageList: React.FC<MessageListProps & { messagesEndRef?: React.RefObject<HTMLDivElement> }> = ({ messages, onReport, typingUser, currentUser, messagesEndRef }) => {
  React.useEffect(() => {
    if (messagesEndRef && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUser, messagesEndRef]);
  return (
    <div className="bg-gradient-to-br from-muted/40 to-white rounded-xl p-6 flex-1 min-h-[60vh] max-h-[70vh] overflow-y-auto flex flex-col gap-4 border shadow-lg">
      {messages.map((msg) => {
        const isCurrentUser = msg.sender === currentUser;
        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className={`group flex flex-col transition-all duration-200 ${isCurrentUser ? "items-end" : "items-start"}`}
          >
            <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
              <div className="relative">
                {msg.avatar ? (
                  <img src={msg.avatar} alt="avatar" className="w-10 h-10 rounded-full border-2 border-primary shadow" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
              </div>
              <span className="text-xs font-bold text-primary/80 group-hover:text-primary">{msg.sender}</span>
              {msg.read && <Check className="w-4 h-4 text-green-500 ml-1" />}
              {msg.reported && <ShieldAlert className="w-4 h-4 text-destructive ml-1" />}
            </div>
            {msg.fileUrl && (
              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
                <Image className="w-5 h-5 inline mr-1" />
                <span className="underline text-primary">View Attachment</span>
              </a>
            )}
            <div
              className={`px-5 py-3 rounded-2xl shadow-lg text-base font-medium max-w-md break-words transition-all duration-200 ${isCurrentUser
                ? "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 text-white border border-blue-400"
                : "bg-gradient-to-r from-gray-100 via-white to-gray-50 text-gray-800 border border-gray-200"}
                group-hover:shadow-xl`}
            >
              {msg.text}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="opacity-70">{msg.timestamp}</span>
              {msg.read && (
                <span className="flex items-center gap-1" title="Read">
                  <Check className="w-4 h-4 text-green-500" />
                </span>
              )}
              <button
                className="ml-2 text-xs text-destructive hover:underline hover:text-red-600 transition"
                onClick={() => onReport(msg.id)}
                title="Report abuse"
              >
                Report
              </button>
            </div>
          </motion.div>
        );
      })}
      {typingUser && (
        <div className="flex items-center gap-2 mt-2 text-muted-foreground text-xs animate-pulse">
          <User className="w-4 h-4" /> {typingUser} is typing...
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
