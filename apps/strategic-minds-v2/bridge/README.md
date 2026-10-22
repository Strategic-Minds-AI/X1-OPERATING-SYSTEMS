# X1 Fleet Bridge Worker

The bridge worker connects your local machine to the X1 Operating System.
Once running, it claims queued jobs (Ollama chat, Docker commands, host shell)
and reports results back to the cloud.

## Setup

1. Copy `.env.example` to `.env` and fill in your values:
   - `X1_BASE_URL` — your X1 app URL (find it in Settings)
   - `X1_WORKER_TOKEN` — get this from the app's Secrets page
   - `X1_WORKER_NAME` — optional, defaults to your machine name

2. Make sure you have installed:
   - Node.js 20+
   - Docker (for container jobs)
   - Ollama (for local model chat)

3. Start the worker:
   ```bash
   node apps/strategic-minds-v2/bridge/worker.js
   ```

Or use the **Start Fleet Bridge** button in the X1 console (Operator Actions).

## What it does

- Sends a heartbeat every 60 seconds so X1 knows your machine is online
- Polls for queued jobs every 5 seconds
- Executes jobs locally:
  - `ollama_chat` — runs a prompt through a local Ollama model
  - `docker_ps` — lists running containers
  - `docker_images` — lists available images
  - `docker_logs` — tails container logs
  - `docker_run` — runs a Docker command
  - `host_shell` — runs a terminal command
- Reports results back to X1

## Troubleshooting

- **Heartbeat fails**: Check that `X1_BASE_URL` and `X1_WORKER_TOKEN` are set correctly.
- **No jobs picked up**: Make sure jobs are queued in X1 (check the Fleet Bridge page).
- **Docker jobs fail**: Ensure Docker is running (`docker info`).
- **Ollama jobs fail**: Ensure Ollama is running (`ollama serve`) and has models (`ollama pull llama3.2`).
