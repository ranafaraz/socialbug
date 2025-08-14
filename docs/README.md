# Socialbug Documentation

## Overview

This wiki provides information on configuring and extending Socialbug. The project uses [n8n](https://n8n.io) as the workflow engine and integrates with the Gemini large language model for content generation.

## Development Setup

1. Ensure Docker CE is installed.
2. Copy `.env.example` to `.env` and set secrets:
   ```bash
   cp .env.example .env
   ```
3. Start the services:
   ```bash
   docker compose up -d
   ```
4. Access n8n at `http://localhost:5678`, the scheduling API at `http://localhost:3000`, and the Django admin at `http://localhost:8000/admin`.

## Gemini Integration

Set `GEMINI_API_KEY` in your `.env` file. The key will be available to n8n workflows and the scheduling API for interacting with the Gemini API.

## Scheduling API

Use the API to register WordPress accounts with base prompts and schedule text posts.

- `POST /accounts` – register an account.
- `POST /accounts/:name/schedule` – schedule a post for an account.

Alternatively, manage accounts and schedules through the Django admin interface which calls an n8n webhook when saving records.

## Future Work

- Add social media posting workflows for more platforms.
- Configure authentication and deployment strategies.
