// src/components/chat/ChatWindow.tsx

import React, { useRef, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";

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

interface ChatWindowProps {
  user: string;
  recipient: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ user, recipient }) => {
  const [messages, setMessages] = useState<Message[]>([]);
    // Load initial messages based on user/recipient
    useEffect(() => {
      let data: Message[] = [];
      if (user === "Patient" && recipient === "Lab") {
        data = [
          { id: 1, sender: "Lab", text: "Welcome to Lab2Home!", timestamp: "09:00 AM", avatar: undefined, read: true },
          { id: 2, sender: "Patient", text: "Hi, I want to book a test.", timestamp: "09:01 AM", avatar: undefined, read: true },
        ];
      } else if (user === "Lab" && recipient === "Patient") {
        data = [
          { id: 1, sender: "Patient", text: "Is my report ready?", timestamp: "10:00 AM", avatar: undefined, read: true },
          { id: 2, sender: "Lab", text: "Your report will be ready by 2 PM.", timestamp: "10:01 AM", avatar: undefined, read: true },
        ];
      } else if (user === "Phlebotomist" && recipient === "Patient") {
        data = [
          { id: 1, sender: "Patient", text: "When will you arrive for sample collection?", timestamp: "11:00 AM", avatar: undefined, read: true },
          { id: 2, sender: "Phlebotomist", text: "I will reach by 11:30 AM.", timestamp: "11:01 AM", avatar: undefined, read: true },
        ];
      }
      setMessages(data);
    }, [user, recipient]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | undefined>(undefined);
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined);

  // Simulate read receipts
  useEffect(() => {
    if (messages.length > 0) {
      setMessages((prev) => prev.map((msg, idx) => idx === prev.length - 1 ? { ...msg, read: true } : msg));
    }
  }, [messages.length]);

  // Simulate typing indicator
  useEffect(() => {
    if (typing) {
      setTypingUser(recipient);
      const timeout = setTimeout(() => setTypingUser(undefined), 1500);
      return () => clearTimeout(timeout);
    }
  }, [typing, recipient]);

  // File upload handler
  const handleFileUpload = (file: File) => {
    // For demo, just create a local URL
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        sender: user,
        text: "[Attachment]",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        fileUrl: url,
        avatar: undefined,
        read: false,
      }
    ]);
  };

  // Send message
  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        sender: user,
        text: input,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        avatar: undefined,
        read: false,
      }
    ]);
    setInput("");
    setTyping(false);
  };

  // Report abuse
  const handleReport = (id: number) => {
    setMessages((prev) => prev.map((msg) => msg.id === id ? { ...msg, reported: true } : msg));
    // Optionally show a toast/notification here
    alert("Message reported for abuse.");
  };

  // Auto-scroll to latest message
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUser]);

  return (
    <Card className="max-w-2xl mx-auto mt-8 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-white rounded-t-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="rounded-full p-2 bg-muted/40 hover:bg-muted/60 transition" aria-label="Back">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="relative">
            {/* Recipient avatar (placeholder if none) */}
            <div className="w-10 h-10 rounded-full border-2 border-primary shadow flex items-center justify-center bg-white">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-primary">{recipient}</span>
            <span className="text-xs text-green-500">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full p-2 bg-muted/40 hover:bg-muted/60 transition" aria-label="Options">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
          </button>
        </div>
      </CardHeader>
      <CardContent className="pb-0">
        <MessageList
          messages={messages}
          onReport={handleReport}
          typingUser={typingUser}
          currentUser={user}
          messagesEndRef={messagesEndRef}
        />
      </CardContent>
      <CardFooter>
        <MessageInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onFileUpload={handleFileUpload}
          typing={typing}
          setTyping={setTyping}
        />
      </CardFooter>
    </Card>
  );
};

export default ChatWindow;
