/**
 * Standalone testing mode -- runs the ClawTile cloud connector
 * with an echo handler, without requiring an OpenClaw instance.
 *
 * Usage:
 *   CLAWTILE_API_KEY=ct_key_xxx npm run standalone
 */
import { CloudConnector } from "./cloud-connector.js";
const config = {
    cloudUrl: process.env.CLAWTILE_CLOUD_URL ?? "ws://localhost:3000/ws/openclaw",
    apiKey: process.env.CLAWTILE_API_KEY ?? "",
};
async function main() {
    if (!config.apiKey) {
        console.warn("[main] CLAWTILE_API_KEY not set -- running in demo mode with empty key");
    }
    const connector = new CloudConnector(config);
    connector.setOnMessage(async (frame) => {
        if (frame.type === "event" && frame.event === "device.message.text") {
            const { deviceId, text } = frame.payload;
            console.log(`[Device ${deviceId}] User said: ${text}`);
            // Echo back for standalone testing
            connector.send({
                type: "event",
                event: "openclaw.message.outbound",
                payload: { deviceId, text: `you said: ${text}` },
            });
        }
    });
    connector.setOnConnected(() => console.log("Connected to ClawTile cloud platform"));
    connector.setOnDisconnected(() => console.log("Disconnected from cloud platform"));
    connector.connect();
    // Graceful shutdown
    const shutdown = () => {
        console.log("\nShutting down...");
        connector.disconnect();
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
main().catch(console.error);
