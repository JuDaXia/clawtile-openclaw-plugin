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
export declare function createSyncMemoTool(): AgentTool;
export declare function createMemoTools(): AgentTool[];
export {};
