🚀 Description

This project is a full stack application built with React (frontend) and NestJS (backend).
The infrastructure runs on Azure, using SQL as the main database, Redis for caching and distributed rate-limiting, and advanced authentication mechanisms such as Google OAuth, GitHub OAuth, JWT, Refresh Tokens, and Two-Factor Authentication (2FA).

The backend implements audit interceptors, secure access control, a Core Module for global configuration and error handling, and a scalable architecture following enterprise-grade best practices and advanced techniques.

🛠️ Technologies
Frontend
React
TypeScript
Backend
NestJS
TypeScript
SQL Server / PostgreSQL
Cache & Distributed Rate Limit
Redis
Cloud
Azure App Services
Azure SQL
Azure Cache for Redis
Azure Pipelines (CI/CD)
Authentication Providers
Google OAuth
GitHub OAuth
JWT
Refresh Tokens
2FA (TOTP)
Security
Distributed rate limiting using Redis
Guards and role-based access control
Session and token hardening
Auditing
Audit Interceptor for logging sensitive operations and access events
Testing


🧱 Architecture & Advanced Features
Core Architecture
Clean Architecture with modular design
Separation of concerns across layers
Repository pattern
Decoupled services
Core Module (Backend)
Global exception filters
Custom error response formatting
Global pipes (validation, transformation)
Global interceptors (audit, timeout, logging)
Global guards (auth, permissions)
Health checks (database, Redis, cache status)
Middlewares for request logging and rate verification
Centralized environment & config management
Security & Auth
Google OAuth provider
GitHub OAuth provider
JWT Authentication
Refresh Token mechanism
Two-Factor Authentication (TOTP)
Session and token storage in Redis
Advanced rate limiting with Redis
Caching & Distributed Systems
Distributed cache with Redis
Distributed rate limiter
Automatic invalidation strategies
High-performance caching layer
Observability & Auditing
AuditInterceptor for tracking sensitive operations
Structured logging
Error tracking through exception filters
Request tracing & metadata logging
DevOps & CI/CD
Azure CI/CD pipelines
Automatic build, test, and deploy

Environment-based configuration

Container-friendly structure
