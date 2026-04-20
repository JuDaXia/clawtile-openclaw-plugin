import { Type } from "@sinclair/typebox";
// Server URL for todo sync (configurable via env)
const CLAWTILE_SERVER = process.env.CLAWTILE_SERVER_URL || "http://localhost:3000";
/**
 * POST structured todos to ClawTile server.
 */
async function postTodosToServer(todos, userId = "default") {
    try {
        const resp = await fetch(`${CLAWTILE_SERVER}/api/todos/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, todos }),
        });
        if (!resp.ok) {
            console.error(`[memo-sync] POST /api/todos/sync failed: ${resp.status} ${resp.statusText}`);
            return false;
        }
        const result = (await resp.json());
        console.log(`[memo-sync] Synced ${result.count} todos to server`);
        return true;
    }
    catch (err) {
        console.error(`[memo-sync] Failed to sync todos:`, err);
        return false;
    }
}
// ─── Tool: Sync Memo ─────────────────────────────
export function createSyncMemoTool() {
    return {
        label: "Sync Memo to ClawTile",
        name: "clawtile_sync_memo",
        description: "将待办事项同步到 ClawTile 墨水屏设备。当你从记忆文件中整理出待办事项后，调用此工具将待办列表上传到服务器，设备会自动拉取显示。传入结构化的待办数组即可。",
        parameters: Type.Object({
            todos: Type.Array(Type.Object({
                text: Type.String({ description: "待办内容" }),
                done: Type.Boolean({ description: "是否已完成" }),
                remindAt: Type.Optional(Type.String({ description: "提醒时间，如 15:00 或 2026-04-07 15:00" })),
                date: Type.Optional(Type.String({ description: "待办日期，如 2026-04-07" })),
            }), { description: "待办事项列表" }),
        }),
        execute: async (_toolCallId, args) => {
            const { todos } = args;
            if (!todos || todos.length === 0) {
                return {
                    content: [{ type: "text", text: "没有待办事项需要同步。" }],
                };
            }
            const success = await postTodosToServer(todos);
            if (success) {
                const pending = todos.filter((t) => !t.done).length;
                const done = todos.filter((t) => t.done).length;
                return {
                    content: [
                        {
                            type: "text",
                            text: `已同步 ${todos.length} 条待办到设备（${pending} 未完成，${done} 已完成）`,
                        },
                    ],
                    details: { synced: true, count: todos.length },
                };
            }
            else {
                return {
                    content: [
                        { type: "text", text: "同步失败，无法连接到 ClawTile 服务器。" },
                    ],
                    details: { synced: false },
                };
            }
        },
    };
}
export function createMemoTools() {
    return [createSyncMemoTool()];
}
