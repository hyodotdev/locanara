import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {chat, summarize, extract} from 'react-native-ondevice-ai';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {CodePatternCard} from './CodePatternCard';
import {StatBadge} from '../../shared/StatBadge';

interface ReasoningStep {
  step: number;
  thought: string;
  action: string;
  observation: string;
}

const LOCAL_DOCS = [
  {
    id: 'doc1',
    title: 'On-Device AI Overview',
    content:
      'On-device AI processes data locally on the user\'s device without sending it to cloud servers. This ensures privacy and enables offline functionality. Apple Intelligence uses Foundation Models, while Android uses Gemini Nano via ML Kit.',
  },
  {
    id: 'doc2',
    title: 'Privacy & Security',
    content:
      'On-device AI keeps all user data on the device. No data is transmitted to external servers. This makes it ideal for sensitive applications like health data, financial information, and personal communications.',
  },
  {
    id: 'doc3',
    title: 'Neural Processing Units',
    content:
      'Modern devices include dedicated NPUs (Neural Processing Units) optimized for AI inference. Apple\'s Neural Engine can perform 35 trillion operations per second. Google\'s Tensor chips include a dedicated TPU for on-device ML.',
  },
  {
    id: 'doc4',
    title: 'Locanara Framework',
    content:
      'Locanara is an open-source on-device AI framework inspired by LangChain. It provides composable chains, memory management, guardrails, and a pipeline DSL for building production AI features using platform-native models.',
  },
];

const SUGGESTIONS = [
  'What privacy benefits does on-device AI provide?',
  'Summarize what NPUs can do',
  'What is the Locanara framework?',
];

export function AgentDemo() {
  const [input, setInput] = useState('');
  const [steps, setSteps] = useState<ReasoningStep[]>([]);
  const [finalAnswer, setFinalAnswer] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [showDocs, setShowDocs] = useState(false);

  const handleRun = async () => {
    const query = input.trim();
    if (!query || isProcessing) return;
    setIsProcessing(true);
    setSteps([]);
    setFinalAnswer('');
    setProcessingTime(null);

    const start = Date.now();

    try {
      // Step 1: Search relevant documents
      const searchStep: ReasoningStep = {
        step: 1,
        thought: `I need to find information about "${query}" in the local documents.`,
        action: 'LocalSearchTool',
        observation: '',
      };

      // Simple keyword search
      const keywords = query.toLowerCase().split(/\s+/);
      const relevantDocs = LOCAL_DOCS.filter((doc) =>
        keywords.some(
          (kw) =>
            kw.length > 3 &&
            (doc.content.toLowerCase().includes(kw) ||
              doc.title.toLowerCase().includes(kw)),
        ),
      );

      searchStep.observation =
        relevantDocs.length > 0
          ? `Found ${relevantDocs.length} relevant document(s): ${relevantDocs.map((d) => d.title).join(', ')}`
          : 'No matching documents found.';
      setSteps([searchStep]);

      // Step 2: Process with AI
      const context = relevantDocs.map((d) => d.content).join('\n\n');
      const processStep: ReasoningStep = {
        step: 2,
        thought: relevantDocs.length > 0
          ? 'I have relevant context. Let me answer the question using this information.'
          : 'No documents found. Let me try to answer from general knowledge.',
        action: 'ChatChain',
        observation: '',
      };
      setSteps((prev) => [...prev, processStep]);

      console.log('[DEBUG] agent chat request:', JSON.stringify({query: query.substring(0, 100), contextLength: context.length}));
      const result = await chat(query, {
        systemPrompt: `You are a helpful assistant. Answer based on this context:\n\n${context}\n\nKeep your answer concise (2-3 sentences).`,
      });
      console.log('[DEBUG] agent chat response:', JSON.stringify(result));

      processStep.observation = result.message;
      setSteps((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = processStep;
        return updated;
      });

      // Step 3: Determine if summarization would help
      if (result.message.length > 200) {
        const sumStep: ReasoningStep = {
          step: 3,
          thought: 'The response is long. Let me summarize it for a concise answer.',
          action: 'SummarizeChain',
          observation: '',
        };
        setSteps((prev) => [...prev, sumStep]);

        const sumResult = await summarize(result.message);
        sumStep.observation = sumResult.summary;
        setSteps((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = sumStep;
          return updated;
        });
        setFinalAnswer(sumResult.summary);
      } else {
        setFinalAnswer(result.message);
      }

      setProcessingTime(Date.now() - start);
    } catch (e: any) {
      setFinalAnswer(`Error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <CodePatternCard
        title="Native Code Pattern"
        code={`// Swift - ReAct-lite Agent
let agent = Agent(
  model: model,
  tools: [
    LocalSearchTool(documents: docs),
    FunctionTool("currentDate") { Date() }
  ],
  chains: [SummarizeChain(model: model)],
  maxSteps: 3
)

let result = try await agent.run(
  "What privacy benefits does on-device AI provide?"
)
// result.steps → reasoning trace
// result.finalAnswer → final response`}
      />

      {/* Local Documents */}
      <TouchableOpacity
        style={styles.docsToggle}
        onPress={() => setShowDocs(!showDocs)}>
        <Ionicons name="documents" size={18} color="#007AFF" />
        <Text style={styles.docsToggleText}>
          Local Documents ({LOCAL_DOCS.length})
        </Text>
        <Ionicons
          name={showDocs ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#8E8E93"
        />
      </TouchableOpacity>

      {showDocs && (
        <View style={styles.docsCard}>
          {LOCAL_DOCS.map((doc) => (
            <View key={doc.id} style={styles.docItem}>
              <Text style={styles.docTitle}>{doc.title}</Text>
              <Text style={styles.docContent} numberOfLines={2}>
                {doc.content}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Suggested queries */}
      <Text style={styles.sectionTitle}>Suggested Queries</Text>
      <View style={styles.suggestionsRow}>
        {SUGGESTIONS.map((s, i) => (
          <TouchableOpacity
            key={i}
            style={styles.suggestionChip}
            onPress={() => setInput(s)}>
            <Text style={styles.suggestionText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        placeholder="Ask a question..."
        placeholderTextColor="#999"
      />

      <TouchableOpacity
        style={[styles.runButton, isProcessing && styles.runButtonDisabled]}
        onPress={handleRun}
        disabled={isProcessing}>
        {isProcessing ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.runButtonText}>Run Agent</Text>
        )}
      </TouchableOpacity>

      {/* Reasoning trace */}
      {steps.length > 0 && (
        <View style={styles.traceCard}>
          <Text style={styles.traceTitle}>Reasoning Trace</Text>
          {processingTime !== null && (
            <View style={styles.badgeRow}>
              <StatBadge label="Time" value={`${processingTime}ms`} />
              <StatBadge label="Steps" value={`${steps.length}`} />
            </View>
          )}
          {steps.map((step, i) => (
            <View key={i} style={[styles.stepBlock, i > 0 && styles.stepSeparator]}>
              <Text style={styles.stepHeader}>Step {step.step}</Text>
              <View style={styles.traceRow}>
                <Ionicons name="bulb" size={14} color="#FF9500" />
                <Text style={styles.traceLabel}>Thought: </Text>
                <Text style={styles.traceText}>{step.thought}</Text>
              </View>
              <View style={styles.traceRow}>
                <Ionicons name="play" size={14} color="#007AFF" />
                <Text style={styles.traceLabel}>Action: </Text>
                <Text style={styles.traceText}>{step.action}</Text>
              </View>
              {step.observation ? (
                <View style={styles.traceRow}>
                  <Ionicons name="eye" size={14} color="#34C759" />
                  <Text style={styles.traceLabel}>Observation: </Text>
                  <Text style={styles.traceText}>{step.observation}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {/* Final answer */}
      {finalAnswer ? (
        <View style={styles.answerCard}>
          <Text style={styles.answerTitle}>Final Answer</Text>
          <Text style={styles.answerText}>{finalAnswer}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7'},
  content: {padding: 16, paddingBottom: 40},
  sectionTitle: {fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8, marginTop: 4},
  docsToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'white', padding: 12, borderRadius: 10, marginBottom: 8,
  },
  docsToggleText: {flex: 1, fontSize: 14, fontWeight: '600', color: '#333'},
  docsCard: {backgroundColor: 'white', borderRadius: 10, padding: 12, marginBottom: 12},
  docItem: {paddingVertical: 6},
  docTitle: {fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2},
  docContent: {fontSize: 13, color: '#666', lineHeight: 18},
  suggestionsRow: {gap: 8, marginBottom: 12},
  suggestionChip: {
    backgroundColor: 'white', borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 8, borderWidth: 1, borderColor: '#E5E5EA',
  },
  suggestionText: {fontSize: 14, color: '#007AFF'},
  input: {
    backgroundColor: 'white', borderRadius: 10, padding: 12,
    fontSize: 15, marginBottom: 12, color: '#000',
  },
  runButton: {
    backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 10,
    alignItems: 'center', marginBottom: 16,
  },
  runButtonDisabled: {opacity: 0.6},
  runButtonText: {color: 'white', fontSize: 17, fontWeight: '600'},
  traceCard: {backgroundColor: 'white', borderRadius: 10, padding: 16, marginBottom: 12},
  traceTitle: {fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8},
  badgeRow: {flexDirection: 'row', gap: 8, marginBottom: 12},
  stepBlock: {paddingVertical: 4},
  stepSeparator: {
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA',
    marginTop: 8, paddingTop: 12,
  },
  stepHeader: {fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 6},
  traceRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingVertical: 2},
  traceLabel: {fontSize: 13, fontWeight: '600', color: '#666'},
  traceText: {flex: 1, fontSize: 13, color: '#333', lineHeight: 18},
  answerCard: {
    backgroundColor: '#E8F5E9', borderRadius: 10, padding: 16,
    borderLeftWidth: 4, borderLeftColor: '#34C759',
  },
  answerTitle: {fontSize: 15, fontWeight: '600', color: '#2E7D32', marginBottom: 8},
  answerText: {fontSize: 15, color: '#333', lineHeight: 22},
});
