# Light DevOps MCP Frontend

A modern, responsive web application that provides an intuitive interface for autonomous DevOps operations through Model Context Protocol (MCP) integration. Built with Next.js 15, TypeScript, and Descope authentication, offering real-time monitoring, deployment management, and role-based access controls for enterprise environments.

## Team Information

**Team Name:** [abhishekrnjn_5879]

**Team Members:** [Abhishek Ranjan]

## Hackathon Theme / Challenge

**Theme:** [Theme 2]

**Challenge Addressed:** Building an autonomous DevOps platform that enables AI agents to perform complex DevOps operations through a standardized Model Context Protocol (MCP) interface, with integrated security, monitoring, and role-based access controls for enterprise environments.

## Project Deployed at

[https://light-devops-mcp-nextjs.vercel.app]


## Demo Video Link

[Demo video will be added here]

## Github Repo link

[https://github.com/abhishekrnjn/light-devops-mcp-nextjs]

## What We Built

We built a comprehensive, production-ready DevOps portal that serves as the frontend interface for autonomous DevOps operations. The platform features:

### Core Features
- **Modern Web Interface**: Next.js 15 with App Router, TypeScript, and Tailwind CSS
- **Model Context Protocol (MCP) Integration**: Seamless communication with backend MCP server
- **Enterprise Authentication**: Descope-based authentication with JWT token management
- **Real-time Monitoring**: Live dashboards for logs, metrics, deployments, and rollbacks
- **Role-based Access Control**: Dynamic UI based on user permissions and roles
- **Responsive Design**: Mobile-first design with collapsible sidebar and mobile navigation

### Key Components
- **Dashboard Layout**: Clean, modern interface with tabbed navigation and sidebar
- **MCP Service Layer**: Robust communication layer with automatic retry and error handling
- **Authentication System**: Secure user management with automatic token refresh
- **Permission Management**: Dynamic feature visibility based on user roles
- **Error Handling**: Comprehensive error handling with authentication error detection
- **Data Visualization**: Real-time data display with loading states and error boundaries

### User Experience
- **Intuitive Navigation**: Tabbed interface for easy access to different DevOps functions
- **Real-time Updates**: Automatic data refresh with loading indicators
- **Mobile Responsive**: Full mobile support with hamburger menu and touch-friendly interface
- **Error Recovery**: Graceful error handling with user-friendly error messages
- **Session Management**: Automatic token refresh and session validation

## How to Run It

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Descope account and project setup
- OpenAI API key
- MCP server running (backend)

### Local Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create `.env.local` file with the following variables:
   ```bash
   # Descope Configuration
   NEXT_PUBLIC_DESCOPE_PROJECT_ID=your_descope_project_id_here
   NEXT_PUBLIC_DESCOPE_BASE_URL=https://api.descope.com
   
   # MCP Server Configuration
   NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:8001
   
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   
   # Next.js Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_here
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Access Application**:
   Open [http://localhost:3000](http://localhost:3000)

### Production Deployment

1. **Deploy to Vercel**:
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Configure Environment Variables** in Vercel dashboard
3. **Redeploy** after adding environment variables

## Tech Stack Used

### Frontend Framework
- **Next.js 15** - React framework with App Router and Server Components
- **React 19** - Latest React with concurrent features and improved performance
- **TypeScript 5** - Type-safe development with strict type checking
- **Tailwind CSS 4** - Utility-first CSS framework with modern features

### Authentication & Security
- **Descope Next.js SDK** - Enterprise authentication platform integration
- **JWT Tokens** - Secure session management with automatic refresh
- **Role-based Access Control** - Dynamic permission-based feature access
- **Session Management** - Automatic token refresh and validation

### Backend Integration
- **MCP Service Layer** - Custom service for Model Context Protocol communication
- **HTTP Client** - Fetch API with retry logic and error handling
- **Token Refresh Service** - Automatic session management and renewal
- **Error Boundary** - Comprehensive error handling and recovery

### State Management & Hooks
- **React Hooks** - useState, useEffect, useContext for state management
- **Custom Hooks** - usePermissions, useMCPConnection, useTokenRefresh
- **Context API** - ChatContext for global state management
- **Local State** - Component-level state for UI interactions

### UI/UX Components
- **Responsive Design** - Mobile-first approach with breakpoint management
- **Sidebar Navigation** - Collapsible sidebar with mobile hamburger menu
- **Tabbed Interface** - Clean navigation between different DevOps functions
- **Loading States** - Skeleton loaders and progress indicators
- **Error Boundaries** - Graceful error handling with user-friendly messages

### Development Tools
- **ESLint** - Code linting with Next.js configuration
- **TypeScript** - Static type checking and IntelliSense
- **PostCSS** - CSS processing and optimization
- **Next.js Dev Tools** - Built-in development and debugging tools

### Required Dependencies
- **Node.js 18+** - JavaScript runtime
- **Modern Web Browser** - Chrome, Firefox, Safari, Edge
- **Descope Account** - Authentication service
- **MCP Server Backend** - Backend API server


## What We'd Do With More Time

### Enhanced User Experience
- **Real-time Updates**: WebSocket integration for live data streaming
- **Advanced Dashboards**: Customizable dashboards with drag-and-drop widgets
- **Dark Mode**: Theme switching with system preference detection
- **Keyboard Shortcuts**: Power user keyboard navigation
- **Progressive Web App**: Offline support and mobile app-like experience

### Advanced Data Visualization
- **Interactive Charts**: D3.js or Chart.js integration for complex data visualization
- **Timeline Views**: Gantt charts for deployment timelines and rollback history
- **Heat Maps**: Performance heat maps for system monitoring
- **Custom Widgets**: User-defined monitoring widgets and alerts

### AI Integration
- **Chat Interface**: AI-powered chat assistant for DevOps operations
- **Natural Language Queries**: Query logs and metrics using natural language
- **Predictive Analytics**: AI-powered failure prediction and recommendations
- **Smart Notifications**: Intelligent alerting with context-aware notifications

### Enterprise Features
- **Multi-tenant Support**: Isolated environments for different teams/projects
- **Audit Logging**: Comprehensive audit trails with searchable history
- **Custom Workflows**: Visual workflow builder for complex operations
- **Integration Hub**: Pre-built connectors for popular DevOps tools
