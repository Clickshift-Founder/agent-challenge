"use client";

import { useEffect, useRef } from "react";
import type { ThoughtEntry } from "../hooks/useThoughtStream";
import { getThoughtMeta } from "../hooks/useThoughtStream";
import styles from "../styles/ThoughtStream.module.css";

interface ThoughtStreamProps {
  thoughts: ThoughtEntry[];
  isConnected: boolean;
}

export default function ThoughtStream({ thoughts, isConnected }: ThoughtStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new thoughts
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts]);

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.titleText}>Thought Stream</span>
        </div>
        <div className={styles.status}>
          <span className={`${styles.statusDot} ${isConnected ? styles.live : ""}`} />
          <span className={styles.statusLabel}>{isConnected ? "Live" : "..."}</span>
        </div>
      </div>

      {/* Thought entries */}
      <div ref={scrollRef} className={styles.scroll}>
        {thoughts.map((thought, i) => {
          const meta = getThoughtMeta(thought.type);
          const time = new Date(thought.timestamp);
          const timeStr = time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          return (
            <div
              key={thought.id || i}
              className={styles.entry}
              style={{ animationDelay: `${Math.min(i, 10) * 0.05}s` }}
            >
              <div className={styles.meta}>
                <span className={styles.icon} style={{ color: meta.color }}>
                  {meta.icon}
                </span>
                <span
                  className={styles.label}
                  style={{
                    background: `${meta.color}18`,
                    color: meta.color,
                    borderColor: `${meta.color}30`,
                  }}
                >
                  {meta.label}
                </span>
                <span className={styles.time}>{timeStr}</span>
              </div>
              <div className={styles.content}>{thought.content}</div>
            </div>
          );
        })}

        {thoughts.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>◈</div>
            <div>Waiting for agent activity...</div>
            <div className={styles.emptyHint}>
              Send a message to see the agent's reasoning in real time
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
