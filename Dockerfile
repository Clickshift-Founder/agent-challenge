# ══════════════════════════════════════════════════════════════
# ClickShift Alpha — ElizaOS Agent Dockerfile
# Nosana x ElizaOS Builders Challenge
#
# Runs: ElizaOS server (agent runtime + built-in web UI)
# Port: 3000
# Model: Qwen3.5-27B-AWQ-4bit (hosted endpoint, not local)
# ══════════════════════════════════════════════════════════════

# ── Stage 1: Build ───────────────────────────────────────────
FROM oven/bun:1.1 AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# Copy source code
COPY . .

# Build the project (ElizaOS CLI compiles TypeScript)
RUN bun run build || true

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM oven/bun:1.1-slim

WORKDIR /app

# Install system dependencies for Solana crypto operations
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install ElizaOS CLI globally
RUN bun install -g @elizaos/cli

# Copy built application from builder stage
COPY --from=builder /app /app

# Copy environment file (will be overridden by Nosana env vars)
COPY .env.production .env

# ── Environment Configuration ────────────────────────────────
# These can be overridden at runtime via Nosana job definition

# ElizaOS server port
ENV PORT=3000

# Model configuration — points to Nosana-hosted Qwen3.5-27B endpoint
# The challenge provides this endpoint for free
ENV OLLAMA_API_URL=https://3yt39qx97wc9hqwwmylrphi4jsxrngjzxnjakkybnxbw.node.k8s.prd.nos.ci/api
ENV MODEL_NAME_AT_ENDPOINT=qwen3:8b

# Database — PGLite for zero-config local persistence
ENV PGLITE_DATA_DIR=/app/.eliza/.elizadb

# Logging
ENV LOG_LEVEL=info
ENV NODE_ENV=production

# ── Expose & Run ─────────────────────────────────────────────
EXPOSE 3000

# Health check — ElizaOS serves the web UI on port 3000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start the ElizaOS agent
# elizaos start runs both the agent runtime and the built-in web UI
CMD ["elizaos", "start"]
