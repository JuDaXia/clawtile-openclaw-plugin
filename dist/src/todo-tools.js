import { Type } from "@sinclair/typebox";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
const TODO_FILE = path.join(os.homedir(), ".openclaw", "clawtile-data", "todos.json");
function ensureDataDir() {
    const dir = path.dirname(TODO_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
function loadTodos() {
    ensureDataDir();
    if (!fs.existsSync(TODO_FILE)) {
        const initial = { todos: [], nextId: 1 };
        fs.writeFileSync(TODO_FILE, JSON.stringify(initial, null, 2));
        return initial;
    }
    return JSON.parse(fs.readFileSync(TODO_FILE, "utf-8"));
}
function saveTodos(data) {
    ensureDataDir();
    fs.writeFileSync(TODO_FILE, JSON.stringify(data, null, 2));
}
// ─── Tool: Add Todo ─────────────────────────────────
export function createAddTodoTool() {
    return {
        label: "Add Todo",
        name: "clawtile_todo_add",
        description: "添加一条待办事项或备忘。当用户说'帮我记一下...'、'添加待办...'、'提醒我...'、'记录...'时使用此工具。",
        parameters: Type.Object({
            text: Type.String({ description: "待办事项内容" }),
            remindAt: Type.Optional(Type.String({
                description: "提醒时间，ISO 8601 格式，如 2026-04-07T15:00:00。如果用户没提到时间则不填。",
            })),
        }),
        execute: async (_toolCallId, args) => {
            const { text, remindAt } = args;
            const data = loadTodos();
            const todo = {
                id: data.nextId++,
                text,
                done: false,
                remindAt: remindAt ?? "",
                createdAt: new Date().toISOString(),
            };
            data.todos.push(todo);
            saveTodos(data);
            const msg = remindAt
                ? `已记录: ${text} (提醒: ${remindAt})`
                : `已记录: ${text}`;
            return {
                content: [{ type: "text", text: msg }],
                details: { todoId: todo.id },
            };
        },
    };
}
// ─── Tool: List Todos ─────────────────────────────────
export function createListTodosTool() {
    return {
        label: "List Todos",
        name: "clawtile_todo_list",
        description: "查看待办事项列表。当用户说'我有什么待办'、'看看任务'、'今天有什么事'、'待办列表'时使用此工具。",
        parameters: Type.Object({
            showDone: Type.Optional(Type.Boolean({ description: "是否显示已完成的待办，默认 false" })),
        }),
        execute: async (_toolCallId, args) => {
            const { showDone } = args;
            const data = loadTodos();
            const pending = data.todos.filter((t) => !t.done);
            const done = data.todos.filter((t) => t.done);
            if (pending.length === 0 && done.length === 0) {
                return {
                    content: [{ type: "text", text: "暂无待办事项。" }],
                };
            }
            let result = "";
            if (pending.length > 0) {
                result += pending
                    .map((t) => {
                    const remind = t.remindAt ? ` [${t.remindAt}]` : "";
                    return `□ ${t.text}${remind}`;
                })
                    .join("\n");
            }
            if (showDone && done.length > 0) {
                result += "\n\n已完成:\n";
                result += done.map((t) => `✓ ${t.text}`).join("\n");
            }
            result += `\n\n共 ${pending.length} 项未完成`;
            if (done.length > 0)
                result += `，${done.length} 项已完成`;
            return {
                content: [{ type: "text", text: result }],
                details: { pendingCount: pending.length, doneCount: done.length },
            };
        },
    };
}
// ─── Tool: Complete Todo ─────────────────────────────
export function createCompleteTodoTool() {
    return {
        label: "Complete Todo",
        name: "clawtile_todo_complete",
        description: "将待办事项标记为已完成。当用户说'XX已经完成了'、'完成XX'、'XX做好了'时使用此工具。",
        parameters: Type.Object({
            keyword: Type.String({
                description: "待办事项的关键字，用于匹配待办内容",
            }),
        }),
        execute: async (_toolCallId, args) => {
            const { keyword } = args;
            const data = loadTodos();
            const todo = data.todos.find((t) => !t.done && t.text.includes(keyword));
            if (!todo) {
                return {
                    content: [
                        { type: "text", text: `未找到包含"${keyword}"的未完成待办。` },
                    ],
                };
            }
            todo.done = true;
            saveTodos(data);
            return {
                content: [{ type: "text", text: `已完成: ${todo.text}` }],
                details: { todoId: todo.id },
            };
        },
    };
}
// ─── Tool: Delete Todo ──────────────────────────────
export function createDeleteTodoTool() {
    return {
        label: "Delete Todo",
        name: "clawtile_todo_delete",
        description: "删除一条待办事项。当用户说'删掉XX'、'移除XX待办'、'不要XX了'时使用此工具。",
        parameters: Type.Object({
            keyword: Type.String({
                description: "待办事项的关键字，用于匹配待办内容",
            }),
        }),
        execute: async (_toolCallId, args) => {
            const { keyword } = args;
            const data = loadTodos();
            const idx = data.todos.findIndex((t) => t.text.includes(keyword));
            if (idx === -1) {
                return {
                    content: [{ type: "text", text: `未找到包含"${keyword}"的待办。` }],
                };
            }
            const removed = data.todos.splice(idx, 1)[0];
            saveTodos(data);
            return {
                content: [{ type: "text", text: `已删除: ${removed.text}` }],
                details: { todoId: removed.id },
            };
        },
    };
}
// ─── Export all tools ─────────────────────────────
export function createAllTodoTools() {
    return [
        createAddTodoTool(),
        createListTodosTool(),
        createCompleteTodoTool(),
        createDeleteTodoTool(),
    ];
}
