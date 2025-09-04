# DevOps MCP Dashboard - Next.js

A modern DevOps dashboard built with Next.js, TypeScript, Tailwind CSS, and Descope authentication.

## 🚀 Features

- **Secure Authentication**: Powered by Descope with your project ID
- **Real-time Dashboard**: Monitor logs, metrics, deployments, and rollbacks
- **Modern UI**: Built with Tailwind CSS and Lucide React icons
- **TypeScript**: Full type safety throughout the application
- **Auto-refresh**: Dashboard automatically refreshes every 30 seconds

## 🛠️ Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   The `.env.local` file is already configured with:
   ```
   NEXT_PUBLIC_DESCOPE_PROJECT_ID=P324tu3z9wiV00Uu0WB8jHrKIvje
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Visit Application**:
   Open [http://localhost:3000](http://localhost:3000)

## 📱 Usage

1. **Authentication**: Users are redirected to Descope login
2. **Dashboard Access**: After login, access the full dashboard
3. **Navigation**: Use tabs to switch between different views:
   - 📊 Overview: System health and quick stats
   - 📝 Logs: Real-time system logs
   - 📊 Metrics: System metrics and performance data
   - 🚀 Deployments: Deployment history and status
   - 🔄 Rollbacks: Rollback operations

## 🔧 API Integration

The dashboard connects to your FastAPI backend at `http://localhost:8000/api/v1` with endpoints:
- `/health` - System health check
- `/logs` - System logs
- `/metrics` - Performance metrics
- `/deployments` - Deployment data
- `/rollbacks` - Rollback information

## 🎨 Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Descope
- **Icons**: Lucide React
- **Charts**: Recharts (ready for use)
- **Date Handling**: date-fns

## 🔒 Authentication Flow

1. User visits application
2. Redirected to Descope authentication
3. After successful login, redirected to dashboard
4. Session managed automatically by Descope
5. Logout clears session and redirects to login

This replaces the previous Streamlit application with a modern, production-ready React/Next.js solution that properly handles authentication and session management.