"use client";

import { useState } from "react";
import ChatPanel from "../components/ChatPanel";
import ThoughtStream from "../components/ThoughtStream";
import { useElizaChat } from "../hooks/useElizaChat";
import { useThoughtStream } from "../hooks/useThoughtStream";

/**
 * Main application page for ClickShift Alpha.
 *
 * Layout: Top bar + split view (Chat panel | Thought stream sidebar)
 *
 * In Next.js, this would be placed at:
 *   app/page.tsx  (App Router)
 *   or pages/index.tsx (Pages Router)
 */
export default function HomePage() {
  const [showThoughts, setShowThoughts] = useState(true);

  const {
    messages,
    sendMessage,
    isConnected: chatConnected,
    isLoading,
    error,
  } = useElizaChat({
    serverUrl: process.env.NEXT_PUBLIC_ELIZA_URL || "http://localhost:3000",
  });

  const {
    thoughts,
    isConnected: streamConnected,
  } = useThoughtStream({
    serverUrl: process.env.NEXT_PUBLIC_ELIZA_URL || "http://localhost:3000",
  });

  return (
    <div className="app-root">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-bar-left">
          <div className="logo-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ts-accent)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
            </svg>
          </div>
          <span className="logo-text">ClickShift Alpha</span>
          <span className="beta-badge">BETA</span>
        </div>

        <div className="top-bar-right">
          <button
            onClick={() => setShowThoughts(!showThoughts)}
            className={`toggle-btn ${showThoughts ? "active" : ""}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 3H6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-4a4 4 0 00-4 4v14a3 3 0 013-3h5z" />
            </svg>
            <span>Thoughts</span>
          </button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* Main content: Chat + Thought Stream */}
      <main className="main-content">
        <ChatPanel
          messages={messages}
          onSend={sendMessage}
          isLoading={isLoading}
          isConnected={chatConnected}
        />

        {showThoughts && (
          <ThoughtStream
            thoughts={thoughts}
            isConnected={streamConnected}
          />
        )}
      </main>

      <style jsx>{`
        .app-root {
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--ts-bg);
          overflow: hidden;
        }

        .top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          height: 52px;
          border-bottom: 1px solid var(--ts-border);
          background: var(--ts-surface);
          flex-shrink: 0;
        }

        .top-bar-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-mark {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: color-mix(in srgb, var(--ts-accent) 12%, transparent);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-text {
          font-weight: 700;
          font-size: 15px;
          letter-spacing: -0.02em;
          color: var(--ts-text);
        }

        .beta-badge {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 4px;
          background: color-mix(in srgb, var(--ts-accent) 15%, transparent);
          color: var(--ts-accent);
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .top-bar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .toggle-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 6px;
          border: 1px solid var(--ts-border);
          background: transparent;
          color: var(--ts-muted);
          font-size: 12px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
        }

        .toggle-btn.active {
          background: color-mix(in srgb, var(--ts-accent) 18%, transparent);
          color: var(--ts-accent);
          border-color: color-mix(in srgb, var(--ts-accent) 30%, transparent);
        }

        .toggle-btn:hover {
          border-color: var(--ts-accent);
          color: var(--ts-accent);
        }

        .error-banner {
          padding: 8px 20px;
          background: color-mix(in srgb, var(--ts-danger) 15%, transparent);
          color: var(--ts-danger);
          font-size: 12px;
          border-bottom: 1px solid color-mix(in srgb, var(--ts-danger) 30%, transparent);
        }

        .main-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .toggle-btn span {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
