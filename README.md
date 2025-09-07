# AI Powered DevOps Portal - Next.js

A modern AI-powered DevOps portal built with Next.js, TypeScript, Tailwind CSS, and Descope authentication.

## 🚀 Features

- **Secure Authentication**: Powered by Descope with your project ID
- **Real-time Dashboard**: Monitor logs, metrics, deployments, and rollbacks
- **AI Assistant**: ChatGPT-powered AI assistant for DevOps operations
- **MCP Integration**: Full integration with Model Context Protocol server
- **Modern UI**: Built with Tailwind CSS and Lucide React icons
- **TypeScript**: Full type safety throughout the application
- **Auto-refresh**: Dashboard automatically refreshes every 30 seconds

## 🛠️ Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env.local` file with the following variables:
   ```
   # Descope Configuration
   NEXT_PUBLIC_DESCOPE_PROJECT_ID=your_descope_project_id_here
   NEXT_PUBLIC_DESCOPE_BASE_URL=https://api.descope.com
   
   # MCP Server Configuration
   NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:8001
   
   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   
   # OpenAI Configuration (for AI Assistant)
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini
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
   - 🤖 AI Assistant: AI-powered chatbot for monitoring and deployment operations
   - 📝 Logs: Real-time system logs
   - 📊 Metrics: System metrics and performance data
   - 🚀 Deployments: Deployment history and status
   - 🔄 Rollbacks: Rollback operations

## 🔧 API Integration

The dashboard connects to your MCP (Model Context Protocol) server at `http://localhost:8001` with endpoints:
- `/mcp/resources` - Available resources (logs, metrics)
- `/mcp/tools` - Available tools (deploy, rollback, authenticate)
- `/mcp/resources/logs` - System logs with filtering
- `/mcp/resources/metrics` - Performance metrics
- `/mcp/tools/deploy_service` - Deploy services to staging/production
- `/mcp/tools/rollback_staging` - Rollback staging deployments
- `/mcp/tools/rollback_production` - Rollback production deployments

## 🤖 AI Assistant

The AI Assistant is powered by OpenAI's GPT models and can:
- Answer questions about your DevOps operations
- Execute MCP tool calls based on user requests
- Help with logs analysis, metrics interpretation, and deployment guidance
- Provide intelligent insights about your infrastructure

**Setup Requirements**:
1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add `OPENAI_API_KEY` to your `.env.local` file
3. Optionally set `OPENAI_MODEL` (defaults to `gpt-4o-mini`)

## 🎨 Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Descope
- **AI Integration**: OpenAI GPT models
- **MCP Protocol**: Model Context Protocol for DevOps operations
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