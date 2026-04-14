# ClickShift Alpha — Demo Video Script
# Duration: 55-60 seconds
# Format: Screen recording + voiceover (or text captions)
# Tool: Loom, OBS, or QuickTime screen record


## PRE-RECORDING CHECKLIST

- [ ] Agent deployed and running on Nosana (live URL)
- [ ] Browser open to the deployment URL
- [ ] Thought Stream panel visible (toggle ON)
- [ ] Chat empty (fresh session)
- [ ] Browser zoomed to 90% so full UI fits in frame
- [ ] Dark mode active (looks better on video)
- [ ] No notifications, clean desktop


## THE SCRIPT

---

### SHOT 1 — Hook (0:00 - 0:05)
**Show:** Full UI — chat panel + thought stream sidebar visible
**Say/Caption:** "ClickShift Alpha — a DeFi intelligence agent that shows you how it thinks."

> Start on the full interface. Let judges see the layout immediately. The thought stream sidebar is the visual hook — no other submission will have it.

---

### SHOT 2 — Rug Check (0:05 - 0:25)
**Action:** Type "Check if BONK is safe" and hit Enter
**Show:** Watch the Thought Stream light up in real time:
  - WAKE: "Message received. Processing..."
  - READ: "Resolving BONK to mint address..."
  - READ: "Querying RugCheck API..."
  - READ: "Pulling market data from DexScreener..."
  - THINK: "Composing risk assessment..."
  - RESULT: "Analysis complete: LOW risk"

**Meanwhile:** The chat shows the full rug analysis appearing — mint authority revoked, freeze authority revoked, holder concentration, liquidity, LP status, risk score.

**Say/Caption:** "Ask about any token. The agent queries RugCheck and DexScreener in real time. Every reasoning step streams live to the Thought Stream panel."

> This is the money shot. 20 seconds showing the core feature. The thought stream scrolling with color-coded labels while the analysis builds in the chat — this is what judges will remember.

---

### SHOT 3 — Dangerous Token (0:25 - 0:40)
**Action:** Type "Someone shilled me $MOONCAT, is it safe?" and hit Enter
**Show:** Thought Stream activates again, but this time:
  - RISK flag appears in red: "CRITICAL risk detected"
  - Chat shows: Rug Score 74/100, mint authority ACTIVE, single wallet 43%, liquidity only $2,100

**Say/Caption:** "It catches dangerous tokens too. Active mint authority, concentrated holdings, no liquidity — all flagged instantly with a CRITICAL risk score."

> The contrast between BONK (safe) and MOONCAT (dangerous) shows the agent isn't just returning canned responses — it actually differentiates based on data.

---

### SHOT 4 — Architecture Flash (0:40 - 0:48)
**Show:** Quick cut to the GitHub repo — scroll past the README showing:
  - The architecture diagram
  - Plugin components table (4 Actions, 3 Providers, 2 Evaluators)
  - "Built with ElizaOS v2"

**Say/Caption:** "Built as a custom ElizaOS v2 plugin with four actions, three providers, two evaluators, and real-time SSE streaming. Fully containerized and deployed on Nosana."

> This 8-second flash proves technical depth without boring the viewer. Judges see the architecture and component count — that's enough.

---

### SHOT 5 — Close (0:48 - 0:55)
**Show:** Cut back to the live app. Thought Stream still scrolling. Briefly show the Nosana deployment dashboard or URL bar showing the .nos.ci domain.

**Say/Caption:** "ClickShift Alpha. DeFi intelligence with transparent reasoning. Built by ClickShift, deployed on Nosana."

> End on the live product, not a slide. Show it's real and running.

---

**TOTAL: ~55 seconds** (5 second buffer for transitions)


## RECORDING TIPS

1. **Record at 1080p minimum** — Nosana's review will be on desktop screens.

2. **Use keyboard, not mouse clicks** — typing looks more natural and professional on screen recordings.

3. **Pre-warm the APIs** — Before hitting record, send a test message so RugCheck and DexScreener endpoints are warm. Cold API calls add 2-3 seconds of awkward waiting.

4. **Voiceover vs captions** — If your mic quality is good, voiceover adds personality. If not, use text captions (add them in post with CapCut or Canva). Either works.

5. **Don't over-explain** — Let the UI speak. The Thought Stream scrolling is visually compelling on its own. Judges will pause and re-watch if they're interested.

6. **Cut dead time** — If the API takes 3 seconds to respond, speed up that segment 2x in post-editing. Keep momentum.

7. **Show the Nosana URL** — Even briefly. Judges need to see it's deployed on Nosana, not localhost. The `.node.k8s.prd.nos.ci` domain in the URL bar is proof.


## ALTERNATIVE: IF API IS SLOW

If live API calls take too long on camera (>5 seconds), consider:
- Pre-recording the analysis completing, then narrating over it
- Speeding up waiting segments 3x with a "fast-forward" visual indicator
- Having the chat pre-loaded with one completed analysis, then doing one live query

The goal is density — judges see many submissions. A fast, polished 50-second video beats a slow, thorough 60-second one.
