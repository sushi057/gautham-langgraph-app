# LangGraph App

This application demonstrates the use of LangGraph to create a conversational agent.

## Overview

The graph also defines several edges that connect the nodes:

- `start` -> `llm`: Always go from the start node to the agent node.
- `llm` -> `tools_condition`: Always go from the llm node to the tools_condition node.
- `tools_condition` -> `tool` (if `use_tool` is "yes"): Go to the tool node if the tool should be used.
- `tools_condition` -> `respond` (if `use_tool` is "no"): Go to the respond node if the tool should not be used.
- `tool` -> `respond`: Always go from the tool node to the respond node.
- `respond` -> `final`: Always go from the respond node to the final node.
- `respond` -> `llm`: Go back to the llm node to continue the conversation.

## Getting Started

### Prerequisites

- Node.js (>=18)
- npm or yarn
- An OpenAI API key

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/sushi057/langgraph-app
    cd langgraph-app
    ```

2.  Install the dependencies:

    ```bash
    npm install
    # or
    yarn install
    ```

3.  Create a `.env` file from the example:

    ```bash
    cp .env.example .env
    ```

    Then add your API key to the `.env` file:

    ```
    OPENAI_API_KEY=your_api_key_here
    ```

### Running the Application

```bash
npm run dev
# or
yarn start
```

## Modifying the Application

### Adding/Removing Tools

1.  Modify the `tools` array in `agent.ts` to include the desired tools.
2.  Add more tools in the `tools.ts`.

### Changing the LLM

1.  Modify the `llm` node in `agent.ts` to use a different language model.
2.  Ensure that the prompt is compatible with the new language model.

### Changing the Prompt

1.  Modify the prompt in the `llm` node in `index.ts` to change the behavior of the agent.
2.  Ensure that the prompt is clear and concise.

### Example: Adding a new tool

Let's say you want to add a new tool called `search_tool`.

1.  **Define the tool:**

    ```typescript
    // filepath: index.ts
    const search_tool = new Tool({
      name: "search_tool",
      description: "useful for when you need to search the internet",
      func: async (query: string) => {
        // ... your search logic here ...
        return "search results";
      },
    });
    ```

2.  **Add the tool to the `tools` array:**

    ```typescript
    // filepath: index.ts
    const tools = [
      // ...existing tools...
      search_tool,
    ];
    ```

## License

MIT
