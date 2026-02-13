// src/components/chat/MessageInput.tsx
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip } from "lucide-react";

interface MessageInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  onFileUpload: (file: File) => void;
  typing: boolean;
  setTyping: (val: boolean) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ value, onChange, onSend, onFileUpload, typing, setTyping }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
      e.target.value = "";
    }
  };

  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleFileChangeEnhanced = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
      if (e.target.files[0].type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(e.target.files[0]));
      } else {
        setFilePreview(e.target.files[0].name);
      }
      e.target.value = "";
    }
  };

  return (
    <div className="flex w-full gap-3 items-center bg-muted/30 rounded-xl px-4 py-3 shadow-lg">
      <Input
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setTyping(true);
        }}
        onBlur={() => setTyping(false)}
        placeholder="Type your message..."
        className="flex-1 rounded-full border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200"
        autoFocus
        onKeyDown={e => {
          if (e.key === "Enter" && value.trim()) {
            onSend();
          }
        }}
      />
      <Button
        type="button"
        variant="ghost"
        className="rounded-full p-2 hover:bg-primary/10 focus:bg-primary/20 transition"
        onClick={() => fileInputRef.current?.click()}
      >
        <Paperclip className="w-5 h-5" />
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChangeEnhanced}
        accept="image/*,application/pdf"
      />
      <Button
        type="button"
        disabled={!value.trim()}
        onClick={onSend}
        className="rounded-full px-5 py-2 flex items-center gap-2 bg-primary text-white hover:bg-primary/90 focus:bg-primary/80 transition-all duration-200 shadow-md"
      >
        <Send className="w-5 h-5 animate-bounce mr-1" /> Send
      </Button>
      {filePreview && (
        <div className="ml-2 flex items-center gap-2 bg-white rounded-lg px-3 py-1 shadow border">
          {filePreview.startsWith("blob:") ? (
            <img src={filePreview} alt="preview" className="w-8 h-8 rounded" />
          ) : (
            <span className="text-xs text-muted-foreground">{filePreview}</span>
          )}
          <button
            type="button"
            className="text-xs text-destructive hover:underline ml-1"
            onClick={() => setFilePreview(null)}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
