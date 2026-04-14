"use client";

import { useState, useEffect, useRef } from "react";
import type { ChatMessage } from "../hooks/useElizaChat";
import styles from "../styles/Chat.module.css";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  isLoading: boolean;
  isConnected: boolean;
}

const QUICK_ACTIONS = [
  { label: "Rug check BONK", action: "Check if BONK is safe" },
  { label: "Analyze $JUP", action: "Analyze JUP for me" },
  { label: "My portfolio", action: "How's my portfolio looking?" },
  { label: "What can you do?", action: "What can you do?" },
];

export default function ChatPanel({ messages, onSend, isLoading, isConnected }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className={styles.chatPanel}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.agentAvatar}>CS</div>
          <div>
            <div className={styles.agentName}>ClickShift Alpha</div>
            <div className={styles.agentDesc}>DeFi Trading Intelligence</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={`${styles.statusDot} ${isConnected ? styles.online : styles.offline}`} />
          <span className={styles.statusText}>{isConnected ? "Online" : "Connecting..."}</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className={styles.chatMessages}>
        {messages.map((msg) => (
          <div key={msg.id} className={`${styles.messageRow} ${msg.role === "user" ? styles.userRow : styles.agentRow}`}>
            <div className={msg.role === "user" ? styles.userBubble : styles.agentBubble}>
              <div className={styles.messageText}>{msg.text}</div>
              <div className={styles.messageTime}>
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className={`${styles.messageRow} ${styles.agentRow}`}>
            <div className={styles.agentBubble}>
              <div className={styles.typingDots}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions (show only when few messages) */}
      {messages.length <= 1 && (
        <div className={styles.quickActions}>
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.label}
              onClick={() => onSend(qa.action)}
              className={styles.quickButton}
            >
              {qa.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about any Solana token..."
            className={styles.input}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={styles.sendButton}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
