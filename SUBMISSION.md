# Agent Description (SuperTeam Submission)
# Max 300 words — current count: 298

ClickShift Alpha is a DeFi trading intelligence agent that helps Solana traders make informed decisions by providing real-time rug pull detection, token analysis, wallet tracking, and portfolio monitoring — with fully transparent reasoning.

## What It Does

When you ask ClickShift Alpha to check a token, it doesn't just return a score. It walks you through every step of its analysis in real time via a Thought Stream panel: resolving the token symbol, querying RugCheck for authority status and LP data, pulling price and liquidity from DexScreener, assessing holder concentration, and composing a final risk verdict (LOW / MEDIUM / HIGH / CRITICAL).

It also tracks wallets for smart money signals, extracts portfolio facts from natural conversation ("I hold 500 JUP"), and proactively flags risk changes across your positions.

## Why It's Different

Most DeFi tools are black boxes — they give you a number with no explanation. ClickShift Alpha makes its reasoning visible. The Thought Stream sidebar shows the agent's internal process as it happens: WAKE → READ → THINK → RESULT. This is inspired by the "transparent autonomy" concept from our production system, Pulse, where autonomous agents show their consciousness stream to build user trust.

## Technical Implementation

Built as a custom ElizaOS v2 plugin with 4 Actions, 3 Providers, 2 Evaluators, 1 Service, and 3 HTTP Routes — including a Server-Sent Events endpoint for real-time thought streaming. The frontend is a Next.js application with Socket.IO chat and SSE-powered reasoning display. External data comes from RugCheck.xyz and DexScreener APIs (no API keys required). The entire stack runs in a single Docker container deployed to Nosana's decentralized GPU network using Qwen3.5-27B for inference.

## Built By

ClickShift — the intelligence infrastructure powering autonomous agents onchain.

#NosanaAgentChallenge @nosana_ai
