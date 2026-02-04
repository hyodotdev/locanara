# Roadmap & TODO

Future features and improvements for Locanara SDK.

## Status Legend

| Status | Meaning |
| ------ | ------- |
| 📋 | Planning |
| 🚧 | In Progress |
| ✅ | Done |
| ❌ | Cancelled |

---

## Telemetry (Locanara Cloud Console)

**Status**: 📋 Planning

Offline-first analytics system for SDK usage monitoring.

### Design Principles

1. **Opt-in Only**: Disabled by default. User must explicitly enable.
2. **Offline-First**: Works without network. Syncs when available.
3. **Privacy Preserved**: No PII. Only aggregate metrics.

### Architecture

```text
Event → Local DB → Network Available? → API Sync → Delete Local
```

### Telemetry Configuration

```swift
// iOS - Opt-in required
Locanara.configure(
    telemetry: .enabled(
        endpoint: "https://api.locanara.dev/telemetry",
        apiKey: "lnr_xxxx"
    )
)

// Default: disabled
Locanara.configure(telemetry: .disabled)
```

```kotlin
// Android - Opt-in required
Locanara.configure(
    telemetry = TelemetryConfig.Enabled(
        endpoint = "https://api.locanara.dev/telemetry",
        apiKey = "lnr_xxxx"
    )
)
```

### Collected Metrics

| Metric | Description |
| ------ | ----------- |
| `device_capability` | npu_available, cpu_only, unsupported |
| `api_call` | summarize, classify, chat, etc. |
| `latency_ms` | Response time |
| `success` | Did the call succeed? |
| `error_code` | Error code if failed |

**NOT Collected**: User input/output, device IDs, location, any PII.

### Local Storage

- SQLite/Room database
- Max 10,000 events
- Auto-delete after 30 days
- Max 1MB storage

### Sync Strategy

| Trigger | Condition |
| ------- | --------- |
| App foreground | >100 pending events |
| Network restored | >50 pending events |
| Background task | iOS: BGTask, Android: WorkManager |

### Telemetry Tasks

- [ ] Define GraphQL schema for telemetry events
- [ ] Implement local storage (iOS: CoreData, Android: Room)
- [ ] Implement sync manager with retry logic
- [ ] Add configuration API to SDK
- [ ] Build Cloud Console backend API
- [ ] Build Cloud Console dashboard UI
- [ ] Add background sync
- [ ] Privacy documentation

### SaaS Pricing (Draft)

| Tier | Events/month | Price |
| ---- | ------------ | ----- |
| Free | 10,000 | $0 |
| Indie | 100,000 | $29/mo |
| Team | 1,000,000 | $99/mo |

---

## Server API Fallback (Pro Only)

**Status**: 📋 Planning

Optional server-side model inference for Pro tier users.

### Concept

Developers can optionally use server-hosted models instead of on-device inference.
**Same API, different backend** - no code changes required.

```text
┌─────────────────────────────────────────────────────────┐
│                    Developer Choice                      │
└─────────────────────┬───────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
   .onDevice (default)        .serverAPI
         │                         │
         ▼                         ▼
┌─────────────────┐     ┌─────────────────────┐
│  Local Models   │     │  Locanara Cloud API │
│  (NPU/CPU/GPU)  │     │  (GPT-4o, Claude,   │
│                 │     │   Gemini, etc.)     │
└─────────────────┘     └─────────────────────┘
```

### Use Cases

| Scenario | Recommendation |
| -------- | -------------- |
| Privacy-critical apps | `.onDevice` |
| Maximum quality needed | `.serverAPI` |
| Offline-first apps | `.onDevice` |
| Complex reasoning tasks | `.serverAPI` |
| Battery/performance sensitive | `.serverAPI` |

### Inference Mode Configuration

```swift
// iOS - Pro Only
Locanara.configure(
    inferenceMode: .serverAPI(
        endpoint: "https://api.locanara.dev/v1",
        apiKey: "lnr_xxxx",
        model: .gpt4o  // or .claude, .gemini
    )
)

// Hybrid mode: try on-device first, fallback to server
Locanara.configure(
    inferenceMode: .hybrid(
        preferOnDevice: true,
        serverFallback: .enabled(apiKey: "lnr_xxxx")
    )
)

// Default: on-device only (same as Community)
Locanara.configure(inferenceMode: .onDevice)
```

```kotlin
// Android - Pro Only
Locanara.configure(
    inferenceMode = InferenceMode.ServerAPI(
        endpoint = "https://api.locanara.dev/v1",
        apiKey = "lnr_xxxx",
        model = ServerModel.GPT4O
    )
)
```

### API Compatibility

```swift
// Same function signature regardless of mode
let result = try await locanara.summarize(text: article)

// Developer doesn't need to change code
// Only configuration determines where inference happens
```

### Pricing Model (Draft)

| Plan | Requests/month | Price |
| ---- | -------------- | ----- |
| Pay-as-you-go | Unlimited | $0.01/request |
| Starter | 10,000 | $49/mo |
| Growth | 100,000 | $299/mo |
| Enterprise | Unlimited | Custom |

### Server API Tasks

- [ ] Design unified API gateway
- [ ] Implement server-side inference routing
- [ ] Add provider integrations (OpenAI, Anthropic, Google)
- [ ] Build usage metering system
- [ ] Add configuration API to SDK (Pro only)
- [ ] Rate limiting and quota management
- [ ] Billing integration

### Privacy Considerations

> **Important**: When using `.serverAPI` mode, user data IS sent to external servers.
> SDK must clearly communicate this to developers.
> Apps using server mode should update their privacy policies accordingly.

---

## Model Marketplace

**Status**: 📋 Planning

Premium model distribution for Pro tier users.

### Marketplace Structure

```text
locanara.dev/models
├── Official Models (Free with Pro)
│   ├── gemma-2b-chat
│   └── tinyllama-1.1b
├── Partner Models (Paid)
│   └── phi-3-mini, mistral-7b-q4
└── Custom Models (Enterprise)
```

### Marketplace Tasks

- [ ] Design model packaging format
- [ ] Build model CDN infrastructure
- [ ] Implement model download manager in SDK
- [ ] Build marketplace UI
- [ ] Partner onboarding process

---

## Support Tiers

**Status**: 📋 Planning

Paid support plans for Community and Pro users.

| Tier | Price | Response Time | Channel |
| ---- | ----- | ------------- | ------- |
| Community | $0 | Best effort | GitHub Issues |
| Developer | $49/mo | 48h | Private Slack |
| Enterprise | Custom | 4h SLA | Dedicated |

### Support Tasks

- [ ] Set up Slack workspace
- [ ] Define SLA terms
- [ ] Build ticketing system integration
- [ ] Pricing page on website

---

## Developer Certification

**Status**: 📋 Planning

Locanara Certified Developer program.

| Level | Price | Content |
| ----- | ----- | ------- |
| Basic | Free | Online course + quiz |
| Pro | $99 | Hands-on project + badge |
| Expert | $299 | 1:1 mentoring + certificate |

### Certification Tasks

- [ ] Create course content
- [ ] Build certification platform
- [ ] Design badges (LinkedIn compatible)
- [ ] Partner with hiring platforms

---

## Changelog

| Date | Change |
| ---- | ------ |
| 2025-01 | Initial roadmap document |

---

**Last Updated**: 2025-01-16
