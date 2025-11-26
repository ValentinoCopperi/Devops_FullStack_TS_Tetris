
🚀 Description

This project is a full stack application built with React (frontend) and NestJS (backend).
The infrastructure runs on Azure, using SQL as the main database, Redis for caching and distributed rate-limiting, and advanced authentication including Google OAuth, GitHub OAuth, JWT, refresh tokens, and 2FA.

The backend implements audit interceptors, secure access control, and a scalable structure following enterprise-grade best practices and advanced techniques.

🛠️ Technologies

Frontend: React + TypeScript

Backend: NestJS + TypeScript

Database: SQL Server / PostgreSQL

Cache & Rate Limit: Redis

Cloud: Azure

Authentication:

Google OAuth

GitHub OAuth

JWT + Refresh Tokens

Two-Factor Authentication (2FA)

Security: Advanced rate limiting with Redis

Auditing: Audit Interceptor for sensitive operations

Testing: Jest / React Testing Library

🧱 Architecture & Advanced Features

Clean Architecture with modular design

Decoupled services and repository pattern

Advanced validation, guards, pipes and interceptors

AuditInterceptor to log critical operations and access events

Distributed Rate Limiter with Redis

Google & GitHub OAuth providers

Two-Factor Authentication (TOTP)

Distributed cache and sessions using Redis

Azure CI/CD pipelines





