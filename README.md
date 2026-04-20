# clawtile-openclaw

ClawTile e-ink device channel plugin for OpenClaw. Connects to the ClawTile cloud platform via WebSocket and acts as a communication bridge between an OpenClaw instance and ClawTile hardware devices.

## Installation

```bash
# In your OpenClaw config directory
npm install github:JuDaXia/clawtile-openclaw-plugin
```

## Configuration

1. Get an API key from the ClawTile web panel (http://voinko.com:3000) →
   **API Keys**.
2. Add to your `openclaw.yaml` (or equivalent `clawdbot.json`):

```yaml
channels:
  clawtile:
    enabled: true
    cloudUrl: "ws://voinko.com:3000/ws/openclaw"
    apiKey: "ct_key_xxxxx"
```

3. Restart OpenClaw. When you see `[clawtile] connected` in the log, power on
   your ClawTile hardware and bind the 6-digit code shown on its screen at the
   web panel → **My Devices**.

## Standalone testing

For testing cloud connectivity without a full OpenClaw setup:

```bash
npm install
CLAWTILE_API_KEY=ct_key_xxx npm run standalone
```

This starts the connector with an echo handler that replies with the user's own message.

## Building

```bash
npm run build   # Compiles TypeScript to dist/
```

## Architecture

- `src/index.ts` -- Plugin entry point, exports the OpenClaw plugin descriptor
- `src/channel.ts` -- ChannelPlugin (sendText, startGateway) + ChannelDock (capabilities)
- `src/runtime.ts` -- Runtime singleton for accessing OpenClaw APIs
- `src/cloud-connector.ts` -- WebSocket client to the ClawTile cloud platform
- `src/message-handler.ts` -- Frame routing (used by standalone mode)
- `src/standalone.ts` -- Standalone testing mode (echo handler, no OpenClaw needed)
- `src/types.ts` -- Shared TypeScript types (Frame, Config, E-ink display)
