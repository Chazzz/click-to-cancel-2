import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

const initialPrompt = "Why do you want to cancel?";

export default function App() {
  const [messages, setMessages] = useState([{ role: "agent", text: initialPrompt }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const generatorRef = useRef(null);

  const ensureGenerator = useCallback(async () => {
    if (!generatorRef.current) {
      const { pipeline } = await import("@xenova/transformers");
      generatorRef.current = await pipeline("text-generation", "Xenova/distilgpt2");
    }
    return generatorRef.current;
  }, []);

  const conversationString = useCallback(
    (pendingUserInput) =>
      [...messages, ...(pendingUserInput ? [{ role: "user", text: pendingUserInput }] : [])]
        .map((message) => `${message.role === "agent" ? "Agent" : "You"}: ${message.text}`)
        .join("\n"),
    [messages]
  );

  const handleSend = useCallback(async () => {
    if (!input.trim()) {
      return;
    }

    const userText = input.trim();
    setMessages((current) => [...current, { role: "user", text: userText }]);
    setInput("");
    setLoading(true);

    try {
      const generator = await ensureGenerator();
      const prompt = conversationString(userText);
      const output = await generator(prompt, {
        max_new_tokens: 80,
        temperature: 0.7,
        top_p: 0.9,
      });
      const generated = output[0]?.generated_text ?? "";
      const completion = generated.slice(prompt.length).trim();
      const cleaned = completion || "I understand. Could you tell me more?";
      setMessages((current) => [...current, { role: "agent", text: cleaned }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "agent",
          text: "I'm having trouble responding right now. Could you try again in a moment?",
        },
      ]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [conversationString, ensureGenerator, input]);

  useEffect(() => {
    if (!messages.length) {
      setMessages([{ role: "agent", text: initialPrompt }]);
    }
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerText}>Cancellation Assistant</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.chatContainer}
        style={styles.chat}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message, index) => (
          <View
            key={`${message.role}-${index}`}
            style={[styles.message, message.role === "agent" ? styles.agentBubble : styles.userBubble]}
          >
            <Text style={styles.messageAuthor}>{message.role === "agent" ? "Agent" : "You"}</Text>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        ))}
        {loading ? (
          <View style={[styles.message, styles.agentBubble, styles.loadingBubble]}>
            <ActivityIndicator color="#fff" />
            <Text style={[styles.messageText, styles.loadingText]}>Agent is thinking…</Text>
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type your response here"
          placeholderTextColor="#aaa"
          value={input}
          onChangeText={setInput}
          editable={!loading}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
          <Text style={styles.sendButtonText}>{loading ? "…" : "Send"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101728",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: "#1f2937",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerText: {
    color: "#f3f4f6",
    fontSize: 20,
    fontWeight: "600",
  },
  chat: {
    flex: 1,
  },
  chatContainer: {
    padding: 16,
    gap: 12,
  },
  message: {
    borderRadius: 12,
    padding: 12,
    maxWidth: "85%",
  },
  agentBubble: {
    backgroundColor: "#2563eb",
    alignSelf: "flex-start",
  },
  userBubble: {
    backgroundColor: "#374151",
    alignSelf: "flex-end",
  },
  messageAuthor: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#e0e7ff",
    fontStyle: "italic",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111827",
  },
  input: {
    flex: 1,
    backgroundColor: "#1f2937",
    color: "#f9fafb",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: Platform.select({ ios: 12, default: 10 }),
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: "#2563eb",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
