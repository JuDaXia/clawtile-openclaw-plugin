interface AgentTool {
    label: string;
    name: string;
    description: string;
    parameters: unknown;
    execute: (toolCallId: string, args: unknown) => Promise<{
        content: Array<{
            type: string;
            text: string;
        }>;
        details?: Record<string, unknown>;
    }>;
}
export declare function createAddTodoTool(): AgentTool;
export declare function createListTodosTool(): AgentTool;
export declare function createCompleteTodoTool(): AgentTool;
export declare function createDeleteTodoTool(): AgentTool;
export declare function createAllTodoTools(): AgentTool[];
export {};
