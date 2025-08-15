# Socialbug

Socialbug is an open source project that aims to automate posting across multiple social media platforms using [n8n](https://n8n.io) workflows and the Gemini large language model. It is designed as a multi-tenant SaaS where each user has a personal workspace and can connect multiple social media accounts. The development environment is containerised and runs locally using Docker CE.


## Development Environment

1. Copy the example environment file and adjust values as needed:

   ```bash
   cp .env.example .env
   ```

2. Start the stack:

   ```bash
   docker compose up -d
   ```

3. Access n8n at [http://localhost:5678](http://localhost:5678).
4. Access the scheduling API at [http://localhost:3000](http://localhost:3000).
5. Redis powers background queues and caching and is available at `redis://localhost:6379` inside the compose stack.
6. Access the Django admin panel at [http://localhost:8000/admin](http://localhost:8000/admin) (default credentials created via `createsuperuser`).

See the [docs](docs/README.md) for more details on configuring workflows and using the Gemini API.

### Scheduling Posts (MVP)

Two options exist for scheduling WordPress posts:

1. **REST API** – Register user workspaces, attach social media accounts, and schedule posts using the Node service at port 3000. Jobs are processed in the background with a Redis-backed Bull queue (see examples below).

2. **Django Admin** – Manage accounts and schedules through the Django admin UI, which automatically triggers an n8n workflow via a webhook when records are saved.

Example API usage:

```bash
# create a user workspace
curl -X POST http://localhost:3000/users

# add a WordPress account under the returned user id
curl -X POST http://localhost:3000/users/<userId>/accounts \
  -H 'Content-Type: application/json' \
  -d '{"name":"blog","siteUrl":"https://example.com","username":"user","password":"pass","basePrompt":"Write a short tech news update about"}'

# schedule a post for that account
curl -X POST http://localhost:3000/users/<userId>/accounts/blog/schedule \

  -H 'Content-Type: application/json' \
  -d '{"topic":"AI advances","publishAt":"2024-08-15T10:00:00Z"}'
```

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our branching strategy, code of conduct and submission process.

## License

This project is licensed under the [MIT License](LICENSE).
