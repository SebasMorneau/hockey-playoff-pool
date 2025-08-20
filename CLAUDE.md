# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack web application for managing hockey playoff pools, built with Node.js/Express backend and React frontend. Uses SQLite by default with PostgreSQL support for production.

## Common Development Commands

### Backend (Node.js/Express/TypeScript)
- `cd backend && npm run dev` - Start development server with hot reload
- `cd backend && npm run build` - Build TypeScript to JavaScript
- `cd backend && npm run start` - Start production server
- `cd backend && npm run test` - Run Jest tests
- `cd backend && npm run lint` - Run ESLint with auto-fix
- `cd backend && npm run format` - Format code with Prettier
- `cd backend && npm run migrate` - Run database migrations
- `cd backend && npm run migrate:undo` - Undo last migration

### Frontend (React/TypeScript/Vite)
- `cd frontend && npm run dev` - Start Vite dev server
- `cd frontend && npm run build` - Build for production
- `cd frontend && npm run preview` - Preview production build
- `cd frontend && npm run lint` - Run ESLint with auto-fix
- `cd frontend && npm run format` - Format code with Prettier

### Docker Deployment
- `docker-compose up -d --build` - Build and start all services
- `./restart.sh` - Restart specific services (exists in root)
- `./restart-all.sh` - Restart all services (exists in root)

## Architecture Overview

### Backend Structure
- **Models** (`backend/src/models/`): Sequelize ORM models for User, Team, Round, Series, Prediction, StanleyCupPrediction
- **Controllers** (`backend/src/controllers/`): Route handlers for auth, teams, predictions, series, admin functions
- **Routes** (`backend/src/routes/`): Express route definitions
- **Middleware** (`backend/src/middleware/`): Authentication, validation, error handling
- **Database**: SQLite default (`backend/data/hockey-pool.db`), PostgreSQL support via environment variables

### Frontend Structure
- **Store** (`frontend/src/store/`): Zustand state management with persistence for authentication
- **Services** (`frontend/src/services/`): API communication layer
- **Components** (`frontend/src/components/`): Reusable React components organized by feature
- **Pages** (`frontend/src/pages/`): Route-level components, includes admin pages
- **Layouts** (`frontend/src/layouts/`): MainLayout, AdminLayout, AuthLayout wrapper components

### Key Features
- **Authentication**: Magic link-based login system
- **Role-based access**: Admin and regular user roles
- **Predictions**: Users predict series winners and game counts
- **Stanley Cup predictions**: Special predictions for final championship
- **Admin panel**: Team management, user management, playoff configuration

### Database Models & Relationships
- Users have many Predictions
- Teams participate in Series as home/away/winner
- Rounds contain multiple Series
- Predictions link Users to Series with predicted winner and game count
- StanleyCupPredictions are separate predictions for the final championship

### Authentication Flow
- Magic link tokens sent via email
- JWT tokens for session management
- Zustand store persists auth state to localStorage
- Axios interceptors handle 401 errors globally

### Environment Configuration
Backend requires environment variables for email service, JWT secrets, and optional PostgreSQL connection. Frontend requires API URL configuration via Vite environment variables.