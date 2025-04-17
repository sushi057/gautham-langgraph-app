# LangGraph App Client

This project is a React-based client application designed to interact with a LangGraph-powered agent. It provides a user-friendly interface for sending messages and receiving real-time responses from the agent, leveraging the `@langchain/langgraph-sdk` for seamless communication.

## Overview

The client application is built using the following technologies:

- **React:** A JavaScript library for building user interfaces.
- **TypeScript:** A typed superset of JavaScript that enhances code maintainability and reduces errors.
- **Vite:** A fast build tool and development server for modern web projects.
- **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
- **@langchain/langgraph-sdk:** A library that simplifies interaction with LangGraph agents, providing tools for streaming messages and managing conversations.

## Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js:** Version 18 or higher. ([https://nodejs.org/](https://nodejs.org/))
- **npm:** (Usually comes with Node.js) or **yarn:** ([https://yarnpkg.com/](https://yarnpkg.com/)) or **pnpm:** ([https://pnpm.io/](https://pnpm.io/))

## Backend Setup

This client application requires a backend server powered by LangGraph. You can find the backend implementation in the [langgraph-app](https://github.com/your-org/langgraph-app) repository. Make sure the backend is running before starting the client. By default, the client is configured to connect to the backend at `http://localhost:2024`.

## Installation

1.  Clone the repository:

```bash
git clone <repository-url>
cd vite-project
```

2.  Install the dependencies using your preferred package manager:

```bash
npm install
# or
yarn install
# or
pnpm install
```

## Development

To start the development server, run:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

This will start the application in development mode, typically at `http://localhost:5173`.

## Configuration

The client application is configured to connect to the LangGraph backend at `http://localhost:2024`. This can be changed inside `src/ui/ChatWindow.tsx`.

## License

[MIT](LICENSE)
