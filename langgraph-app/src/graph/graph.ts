import { MemorySaver } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { agent, tools } from "./agent.js";
import { toolsCondition } from "@langchain/langgraph/prebuilt";

const toolNode = new ToolNode(tools);

// Create a standard messages graph
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", agent)
  .addNode("tools", toolNode);

workflow.addEdge("__start__", "agent");
workflow.addConditionalEdges("agent", toolsCondition);
workflow.addEdge("tools", "agent");

const checkpointer = new MemorySaver();

export const app = workflow.compile({ checkpointer });
