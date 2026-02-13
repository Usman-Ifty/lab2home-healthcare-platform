import React, { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  MessageCircle,
  Clock,
  FileCheck,
  MessageSquare,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Download,
  X,
  Lock
} from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";
import { chatService } from "@/services/chat.service";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/booking.service";

type Message = {
  _id: string;
  conversation: string;
  sender: "patient" | "lab" | "phlebotomist";
  content: string;
  createdAt: string;
  status: "sent" | "delivered" | "read";
  attachments: {
    _id?: string;
    filename: string;
    contentType: string;
    size: number;
  }[];
};

type Conversation = {
  _id: string;
  patient?: { _id: string; fullName: string; email: string };
  lab?: { _id: string; labName: string; email: string };
  phlebotomist?: { _id: string; fullName: string; email: string };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: { patient: number; lab: number; phlebotomist: number };
};

const MessageStatusIcon = ({ status }: { status: string }) => {
  if (status === 'read') return <CheckCheck size={16} className="text-green-300" />;
  if (status === 'delivered') return <CheckCheck size={16} className="text-white/70" />;
  return <Check size={16} className="text-white/70" />;
};

// Component to render attachment previews (Images/PDFs)
const AttachmentPreview = ({ messageId, attachment, index, token }: { messageId: string, attachment: any, index: number, token: string }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (attachment.contentType.startsWith('image/')) {
      setLoading(true);
      setError(false);

      chatService.fetchAttachmentBlob(messageId, index, token)
        .then(blob => {
          if (blob.size === 0) {
            setError(true);
            return;
          }
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        })
        .catch(err => {
          console.error("Failed to load image", err);
          setError(true);
        })
        .finally(() => setLoading(false));
    }
  }, [messageId, index, token, attachment.contentType]);

  const handleDownload = async () => {
    try {
      const blob = await chatService.fetchAttachmentBlob(messageId, index, token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download", err);
    }
  };

  if (attachment.contentType.startsWith('image/')) {
    return (
      <div className="mb-2 relative group inline-block">
        {loading ? (
          <div className="w-48 h-48 bg-gray-200 animate-pulse rounded-md flex items-center justify-center">
            <ImageIcon className="text-gray-400" />
          </div>
        ) : error ? (
          <div className="w-48 h-48 bg-red-50 rounded-md flex flex-col items-center justify-center border border-red-200 text-red-500 p-2 text-center">
            <ImageIcon className="mb-2" />
            <span className="text-xs">Failed to load</span>
          </div>
        ) : (
          imageUrl && (
            <div className="relative">
              <img
                src={imageUrl}
                alt={attachment.filename}
                className="max-w-[250px] max-h-[250px] rounded-md object-cover cursor-pointer bg-gray-100"
                onClick={() => window.open(imageUrl, '_blank')}
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download size={14} />
              </button>
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-2 border hover:bg-muted transition-colors group max-w-xs">
      <div className="p-2 bg-red-100 rounded text-red-600">
        <FileText size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.filename}</p>
        <p className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</p>
      </div>
      <button
        onClick={handleDownload}
        className="p-2 hover:bg-background rounded-full transition-colors"
        title="Download"
      >
        <Download size={16} className="text-muted-foreground" />
      </button>
    </div>
  );
};

const LabMessages = () => {
  const { socket } = useSocket();
  const { token, user } = useAuth();
  const [chatType, setChatType] = useState<'patient' | 'phlebotomist'>('patient');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [availablePatients, setAvailablePatients] = useState<{ _id: string; fullName: string }[]>([]);
  const [availablePhlebotomists, setAvailablePhlebotomists] = useState<{ _id: string; fullName: string }[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Conversations and Bookings
  useEffect(() => {
    if (token && user) {
      // Fetch Conversations
      chatService.getConversations(token).then((data) => {
        if (data.success) {
          setConversations(data.conversations);
        }
      });

      // Fetch Bookings to find available patients and phlebotomists
      bookingService.getLabBookings(user.id, token).then((data) => {
        if (data.success) {
          const bookings = data.data || [];

          // Extract unique patients
          const patients = new Map();
          bookings.forEach((b: any) => {
            if (b.patient) {
              patients.set(b.patient._id, b.patient);
            }
          });
          setAvailablePatients(Array.from(patients.values()));

          // Extract unique phlebotomists
          const phlebotomists = new Map();
          bookings.forEach((b: any) => {
            if (b.phlebotomist) {
              phlebotomists.set(b.phlebotomist._id, b.phlebotomist);
            }
          });
          setAvailablePhlebotomists(Array.from(phlebotomists.values()));
        }
      });
    }
  }, [token, user]);

  // Handle Chat Selection (Create if not exists)
  const handleChatSelect = async (contactId: string) => {
    setSelectedContactId(contactId);

    // Check if conversation already exists
    const existingConv = conversations.find(c =>
      chatType === 'patient' ? c.patient?._id === contactId : c.phlebotomist?._id === contactId
    );

    if (existingConv) {
      setSelectedChatId(existingConv._id);
    } else {
      // Create new conversation
      if (token) {
        try {
          const data = await chatService.createConversation(contactId, token, chatType);
          if (data.success) {
            setConversations(prev => [data.conversation, ...prev]);
            setSelectedChatId(data.conversation._id);
          }
        } catch (err) {
          console.error("Failed to create conversation", err);
        }
      }
    }
  };

  // Switch chat type
  const handleChatTypeChange = (type: 'patient' | 'phlebotomist') => {
    setChatType(type);
    setSelectedChatId(null);
    setSelectedContactId(null);
    setMessages([]);
    setIsLocked(false);
  };

  // Fetch Messages & Join Room
  useEffect(() => {
    if (selectedChatId && token) {
      chatService.getMessages(selectedChatId, token).then((data) => {
        if (data.success) {
          setMessages(data.messages);
          chatService.markAsRead(selectedChatId, token);
        }
      });

      if (socket) {
        socket.emit("join_conversation", selectedChatId);
      }
    }
  }, [selectedChatId, token, socket]);

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("new_message", (message: Message) => {
      if (selectedChatId && message.conversation === selectedChatId) {
        setMessages((prev) => {
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
        if (token) chatService.markAsRead(selectedChatId, token);
      }
      setConversations(prev => prev.map(c =>
        c._id === message.conversation
          ? { ...c, lastMessage: message.content || 'Attachment', lastMessageAt: message.createdAt }
          : c
      ));
    });

    socket.on("messages_read", ({ conversationId }) => {
      if (conversationId === selectedChatId) {
        setMessages(prev => prev.map(m => ({ ...m, status: 'read' })));
      }
    });

    socket.on("conversation_locked", ({ conversationId }) => {
      if (conversationId === selectedChatId) {
        setIsLocked(true);
      }
    });

    return () => {
      socket.off("new_message");
      socket.off("messages_read");
      socket.off("conversation_locked");
    };
  }, [socket, selectedChatId, token]);

  // Scroll to bottom
  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const sendMessage = async () => {
    if ((!input.trim() && files.length === 0) || !selectedChatId || !token || isLocked) {
      return;
    }

    try {
      const data = await chatService.sendMessage(selectedChatId, input, files, token);
      if (data.success) {
        setMessages((prev) => {
          if (prev.some(m => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
        setInput("");
        setFiles([]);
        setErrorMessage(null);
      } else {
        setErrorMessage(data.message || "Failed to send message");
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (error) {
      console.error("Failed to send message", error);
      setErrorMessage("An unexpected error occurred.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const currentContacts = chatType === 'patient' ? availablePatients : availablePhlebotomists;
  const selectedConversation = conversations.find(c => c._id === selectedChatId);

  return (
    <DashboardLayout role="lab">
      <div className="flex flex-col gap-6 h-[calc(100vh-80px)]">

        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            Communicate with patients and phlebotomists.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 h-full">

          {/* CHAT PANEL */}
          <Card className="lg:col-span-2 p-4 rounded-xl shadow-md bg-card flex flex-col h-full overflow-hidden">

            {/* Chat Type Selector */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={chatType === 'patient' ? 'default' : 'outline'}
                onClick={() => handleChatTypeChange('patient')}
                className="flex-1"
              >
                Chat with Patients
              </Button>
              <Button
                variant={chatType === 'phlebotomist' ? 'default' : 'outline'}
                onClick={() => handleChatTypeChange('phlebotomist')}
                className="flex-1"
              >
                Chat with Phlebotomists
              </Button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                {selectedChatId ? `Chat with ${chatType === 'patient' ? selectedConversation?.patient?.fullName : selectedConversation?.phlebotomist?.fullName}` : `Select ${chatType === 'patient' ? 'Patient' : 'Phlebotomist'} to Chat`}
              </h2>
              <select
                value={selectedContactId || ""}
                onChange={(e) => handleChatSelect(e.target.value)}
                className="border px-3 py-1 rounded-md text-sm"
              >
                <option value="" disabled>Select {chatType === 'patient' ? 'Patient' : 'Phlebotomist'}</option>
                {currentContacts.map((contact: any) => (
                  <option key={contact._id} value={contact._id}>
                    {chatType === 'patient' ? contact.fullName : contact.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div ref={chatRef} className="flex-1 overflow-y-auto bg-muted/30 border rounded-lg p-4 space-y-3">
              {messages.map((msg, i) => {
                const isMe = msg.sender === 'lab';
                return (
                  <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-4 py-2 rounded-xl shadow-sm
                        ${isMe
                        ? "bg-primary text-white rounded-br-none"
                        : "bg-white border rounded-bl-none"}`}>

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-2 space-y-1">
                          {msg.attachments.map((att, idx) => (
                            <AttachmentPreview
                              key={idx}
                              messageId={msg._id}
                              attachment={att}
                              index={idx}
                              token={token!}
                            />
                          ))}
                        </div>
                      )}

                      {msg.content && <p className="text-sm">{msg.content}</p>}

                      <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? "text-white/70" : "text-muted-foreground"}`}>
                        <p className="text-[10px]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        {isMe && (
                          <span className="ml-1">
                            <MessageStatusIcon status={msg.status} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* File Preview */}
            {files.length > 0 && (
              <div className="flex gap-2 p-2 bg-muted/20 text-xs overflow-x-auto">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-background border px-2 py-1 rounded-md whitespace-nowrap">
                    <span className="truncate max-w-[100px]">{f.name}</span>
                    <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-2 p-2 bg-red-100 border border-red-200 text-red-600 rounded-md flex items-center justify-between text-sm">
                <span>{errorMessage}</span>
                <button onClick={() => setErrorMessage(null)} className="text-red-800 hover:text-red-900">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Locked Message or Input */}
            {isLocked ? (
              <div className="mt-4 p-4 bg-muted/50 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center">
                <Lock className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="font-semibold">Report Uploaded - Chat Closed</p>
                <p className="text-sm text-muted-foreground">This conversation is now read-only</p>
              </div>
            ) : (
              <div className="flex gap-3 mt-4 border p-2 rounded-xl bg-background items-center">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                />
                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Input
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!input.trim() && files.length === 0}>
                  <Send className="h-4 w-4 mr-1" /> Send
                </Button>
              </div>
            )}
          </Card>

          {/* RIGHT STAT CARDS */}
          <div className="space-y-4">

            <Card className="p-5 rounded-xl shadow-md border">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Active Chats</p>
                  <p className="text-2xl font-bold">{conversations.length} Chats</p>
                  <p className="text-xs text-muted-foreground mt-1">Manage discussions</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <MessageCircle className="h-6 w-6" />
                </div>
              </div>
            </Card>

          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default LabMessages;
