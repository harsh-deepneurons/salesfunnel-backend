---
name: backend-engineering
description: Architect and implement robust, production-grade backend systems. Use this skill when the user asks to build APIs, server logic, database schemas, microservices, authentication systems, or data pipelines. Generates secure, scalable, and maintainable code that avoids brittle "happy-path-only" implementations.
license: Complete terms in LICENSE.txt
---

This skill guides the creation of resilient, high-performance backend infrastructure. Avoid "tutorial-level" code. Implement real working systems with exceptional attention to security, data integrity, and architectural cleanliness.

The user provides backend requirements: an API endpoint, a database schema, a full server architecture, or a specific algorithmic problem. They may include context about scale, traffic patterns, or integration points.

## Systems Thinking

Before coding, define the architectural strategy and commit to a SOLID technical direction:
- **Data Strategy**: How does data flow? Choose the right tool for the job (Relational vs. Document vs. Graph). Define distinct boundaries between transient data (Cache/Redis) and persistent data (Postgres/Mongo).
- **Architecture Pattern**: Pick a pattern that fits the scale: Modular Monolith (great for starting), Microservices (for independent scaling), Serverless (for event-driven), or Hexagonal/Clean Architecture (for complex logic).
- **Constraints**: Throughput requirements, latency budgets, strict consistency vs. eventual consistency, and cost limitations.
- **Resilience**: How does this fail? What happens when the database hangs? What happens when the third-party API is down?

**CRITICAL**: Choose a clear architectural pattern and execute it with discipline. A well-structured monolith is infinitely better than a chaotic microservice mesh. The key is separation of concerns and type safety.

Then implement working code (Node/Express, Python/FastAPI, Go, Rust, etc.) that is:
- Secure by design (OWASP Top 10 aware)
- Idempotent and consistent
- Observable (logging and metrics)
- Meticulously typed and validated

## Backend Engineering Guidelines

Focus on:
- **API Design**: Adhere strictly to RESTful standards or GraphQL best practices. Use predictable resource naming, proper HTTP status codes (201 created, 400 bad request, 403 forbidden), and standard envelopes for responses. **Always** implement versioning.
- **Data Modeling**: Design schemas that reflect the domain. Use normalization to reduce redundancy, but denormalize intentionally for read-heavy performance. Define indexes based on query patterns, not guessing. Enforce constraints (Foreign Keys, Unique) at the database level, not just the application level.
- **Security & Validation**: NEVER trust client input. Implement rigid validation (Zod, Pydantic, Joi) at the entry point. Sanitize all queries. Handle Authentication (JWT, Session, OAuth) and Authorization (RBAC/ABAC) explicitly. Manage secrets using environment variables, never hardcoded.
- **Performance & Concurrency**: Offload heavy tasks to background queues (BullMQ, Celery, Kafka). Use caching strategies (Write-through, Look-aside) to protect the database. Handle concurrency with transactions and proper locking mechanisms to prevent race conditions.
- **Code Structure**: Decouple logic. Controllers should only handle HTTP requests. Services should handle business logic. Repositories/DAOs should handle data access. Dependency Injection should be used to improve testability.

NEVER use brittle coding patterns like: swallowing errors (empty catch blocks), "God functions" (one function doing validation, DB calls, and response formatting), n+1 query loops, hardcoded configuration, or ambiguous variable naming (e.g., `data`, `temp`, `res`).

Interpret technical requirements to build systems that survive in the wild. Vary the complexity based on the need—use simple scripts for automation, but robust, typed structures for core business logic.

**IMPORTANT**: Match implementation complexity to the scale. A prototype needs speed and flexibility, but a financial ledger needs ACID compliance, audit logs, and double-entry accounting. Reliability comes from anticipating failure.

Remember: A backend is the engine room. It doesn't need to look pretty, but it must be bulletproof, fast, and silent. Show what can be achieved when engineering for longevity and scale.