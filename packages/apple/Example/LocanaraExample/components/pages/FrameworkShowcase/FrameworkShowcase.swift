import SwiftUI
import Locanara

enum FrameworkDemoType: String, CaseIterable, Identifiable {
    case model
    case chain
    case pipeline
    case memory
    case guardrail
    case session
    case agent

    var id: String { rawValue }

    var title: String {
        switch self {
        case .model: return "Model"
        case .chain: return "Chain"
        case .pipeline: return "Pipeline DSL"
        case .memory: return "Memory"
        case .guardrail: return "Guardrail"
        case .session: return "Session"
        case .agent: return "Agent + Tools"
        }
    }

    var icon: String {
        switch self {
        case .model: return "cpu"
        case .chain: return "link"
        case .pipeline: return "arrow.triangle.swap"
        case .memory: return "brain.head.profile"
        case .guardrail: return "shield.checkered"
        case .session: return "bubble.left.and.bubble.right"
        case .agent: return "person.crop.circle.badge.questionmark"
        }
    }

    var description: String {
        switch self {
        case .model:
            return "Direct model usage with GenerationConfig presets and streaming"
        case .chain:
            return "ModelChain, SequentialChain, ParallelChain, ConditionalChain, and custom chains"
        case .pipeline:
            return "Compose multiple AI steps into a single pipeline with compile-time type safety"
        case .memory:
            return "BufferMemory and SummaryMemory — conversation history management"
        case .guardrail:
            return "Wrap chains with input length and content safety guardrails"
        case .session:
            return "Stateful chat with BufferMemory — see memory entries in real-time"
        case .agent:
            return "ReAct-lite agent with tools and step-by-step reasoning trace"
        }
    }
}

/// Framework Showcase — demos of Model, Chain, Pipeline, Memory, Guardrail, Session, Agent
struct FrameworkShowcase: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        NavigationStack {
            List {
                Section {
                    AIStatusBanner()
                }
                .listRowInsets(EdgeInsets())
                .listRowBackground(Color.clear)

                Section {
                    Text("These demos show how to build custom AI features using the framework primitives — Model, Chain, Pipeline, Memory, Guardrail, Session, and Agent.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Section("Framework Demos") {
                    ForEach(FrameworkDemoType.allCases) { demo in
                        NavigationLink {
                            frameworkDemoView(for: demo)
                                .navigationTitle(demo.title)
                        } label: {
                            Label {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(demo.title)
                                        .font(.body.weight(.medium))
                                    Text(demo.description)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                        .lineLimit(2)
                                }
                            } icon: {
                                Image(systemName: demo.icon)
                                    .foregroundStyle(.blue)
                                    .frame(width: 28)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
            }
            .navigationTitle("Framework")
        }
    }

    @ViewBuilder
    private func frameworkDemoView(for demo: FrameworkDemoType) -> some View {
        switch demo {
        case .model:
            ModelDemo()
        case .chain:
            ChainDemo()
        case .pipeline:
            PipelineDemo()
        case .memory:
            MemoryDemo()
        case .guardrail:
            GuardrailDemo()
        case .session:
            SessionDemo()
        case .agent:
            AgentDemo()
        }
    }
}
