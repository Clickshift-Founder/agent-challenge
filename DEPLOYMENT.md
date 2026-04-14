# ══════════════════════════════════════════════════════════════
# ClickShift Alpha — Deployment Guide
# Nosana x ElizaOS Builders Challenge
# ══════════════════════════════════════════════════════════════

## Prerequisites

- Docker installed and running
- Docker Hub account (free)
- Nosana builder credits (https://nosana.com/builders-credits)
- Phantom wallet with SOL + NOS for job posting


## Step 1: Build Locally

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/agent-challenge
cd agent-challenge

# Copy environment
cp .env.example .env

# Install dependencies
bun install

# Test locally without Docker first
elizaos dev
# Open http://localhost:3000 — verify agent responds
```


## Step 2: Docker Build & Test

```bash
# Build the Docker image
docker build -t clickshift-alpha:latest .

# Test the container locally
docker run -p 3000:3000 \
  -e LOG_LEVEL=debug \
  -e OLLAMA_API_URL=https://3yt39qx97wc9hqwwmylrphi4jsxrngjzxnjakkybnxbw.node.k8s.prd.nos.ci/api \
  -e MODEL_NAME_AT_ENDPOINT=qwen3:8b \
  clickshift-alpha:latest

# Open http://localhost:3000 — verify everything works in container
# Test: "Check if BONK is safe" — should return rug analysis
# Test: "Analyze JUP" — should return token analysis
# Check thought stream panel is receiving events
```

### Troubleshooting Docker

```bash
# Check container logs
docker logs clickshift-alpha

# Shell into running container
docker exec -it clickshift-alpha /bin/sh

# Check if ElizaOS started correctly
docker exec clickshift-alpha curl http://localhost:3000/api/agents

# Rebuild without cache if dependencies changed
docker build --no-cache -t clickshift-alpha:latest .
```


## Step 3: Push to Docker Hub

```bash
# Login to Docker Hub
docker login

# Tag with your Docker Hub username
docker tag clickshift-alpha:latest YOUR_DOCKERHUB_USERNAME/clickshift-alpha:latest

# Push
docker push YOUR_DOCKERHUB_USERNAME/clickshift-alpha:latest
```


## Step 4: Deploy to Nosana

### Option A: Dashboard (Recommended)

1. Go to https://deploy.nosana.com
2. Click "Deploy" or "New Job"
3. Click "Expand" to open the job definition editor
4. Paste the contents of `nos_job_def/nosana_clickshift_alpha.json`
5. **IMPORTANT**: Replace `YOUR_DOCKERHUB_USERNAME` with your actual username
6. Select GPU market: `nvidia-3090`
7. Click "Deploy"
8. Wait for the job to start — you'll get a deployment URL

### Option B: CLI

```bash
# Install Nosana CLI
npm install -g @nosana/cli

# Edit the job definition first — replace YOUR_DOCKERHUB_USERNAME
# Then deploy
nosana job post \
  --file ./nos_job_def/nosana_clickshift_alpha.json \
  --market nvidia-3090 \
  --timeout 30
```


## Step 5: Verify Deployment

```bash
# Your deployment URL will look like:
# https://XXXXXXX.node.k8s.prd.nos.ci

# Test the deployment
curl https://YOUR-DEPLOYMENT-URL/api/defi/health

# Expected response:
# {"status":"ok","agent":"ClickShift Alpha","plugin":"defi-intelligence","version":"1.0.0"}

# Open in browser — verify chat + thought stream work
```


## Updating Your Deployment

```bash
# Make changes to code
# Rebuild
docker build -t YOUR_DOCKERHUB_USERNAME/clickshift-alpha:latest .

# Push updated image
docker push YOUR_DOCKERHUB_USERNAME/clickshift-alpha:latest

# Redeploy on Nosana Dashboard (stop old job, deploy new one)
```


## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 3000 | Server port |
| OLLAMA_API_URL | Yes | (Nosana endpoint) | LLM inference endpoint |
| MODEL_NAME_AT_ENDPOINT | Yes | qwen3:8b | Model name |
| PGLITE_DATA_DIR | No | ./.eliza/.elizadb | Database path |
| SOLANA_RPC_URL | No | mainnet-beta | Solana RPC endpoint |
| LOG_LEVEL | No | info | debug/info/warn/error |
| NODE_ENV | No | production | Environment mode |
