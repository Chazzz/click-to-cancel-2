import { useCallback, useEffect, useRef, useState } from "react";

const initialPrompt = "Why do you want to cancel?";
const MAX_TURNS = 6;
const STOP_REGEX = /\n(?:User|You|Human)\s*:\s*|<\/assistant>/i;
const MODEL_CANDIDATES = [
  "Xenova/Qwen2-1.5B-Instruct",
  "Xenova/Qwen2-0.5B-Instruct",
  "Xenova/distilgpt2",
];

const trimMessageHistory = (history) => {
  const result = [...history];
  while (result.length > MAX_TURNS * 2) {
    result.splice(0, 2);
  }
  return result;
};

const dedupeSentences = (text) => {
  if (!text) return "";

  const seen = new Set();
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((segment) => {
      const trimmed = segment.trim();
      if (!trimmed) return false;
      const lowered = trimmed.toLowerCase();
      if (seen.has(lowered)) return false;
      seen.add(lowered);
      return true;
    })
    .join(" ")
    .trim();
};

export default function App() {
  const [messages, setMessages] = useState([{ role: "agent", text: initialPrompt }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const generatorRef = useRef(null);
  const endOfMessagesRef = useRef(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const ensureGenerator = useCallback(async () => {
    if (!generatorRef.current) {
      const { env, pipeline } = await import("@xenova/transformers");
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      for (const model of MODEL_CANDIDATES) {
        try {
          generatorRef.current = await pipeline("text-generation", model);
          break;
        } catch (error) {
          console.error(`Unable to load ${model}, trying next fallback`, error);
        }
      }

      if (!generatorRef.current) {
        throw new Error("No available text-generation models");
      }
    }
    return generatorRef.current;
  }, []);

  const scrollToEnd = useCallback(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, loading, scrollToEnd]);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const nextHistory = trimMessageHistory([
        ...messagesRef.current,
        { role: "user", text: trimmed },
      ]);
      setMessages(nextHistory);
      messagesRef.current = nextHistory;
      setInput("");
      setLoading(true);

      try {
        const generator = await ensureGenerator();
        const conversation = nextHistory
          .map((message) =>
            `${message.role === "agent" ? "Assistant" : "User"}: ${message.text}`
          )
          .join("\n");
        const systemPrompt = [
          "You are a helpful, concise assistant.",
          "- Always respond with ONE short, context-based QUESTION.",
          "- Do NOT repeat the user's words verbatim.",
          "- Keep answers under 20 words.",
          "- If the user states a problem, ask a targeted clarifying question.",
        ].join("\n");
        const prompt = `${systemPrompt}\n\nConversation:\n${conversation}\nAssistant:`;
        const output = await generator(prompt, {
          max_new_tokens: 80,
          temperature: 0.6,
          top_p: 0.9,
          top_k: 50,
          repetition_penalty: 1.3,
          no_repeat_ngram_size: 4,
          do_sample: true,
        });
        const fullText = output[0]?.generated_text ?? "";
        let assistant = fullText.split("Assistant:").pop() ?? "";
        assistant = assistant.split(STOP_REGEX)[0]?.trim() ?? "";
        assistant = dedupeSentences(assistant);

        const echoesUser = assistant && trimmed && assistant.toLowerCase().includes(trimmed.toLowerCase());
        if (!assistant || assistant.length < 3 || echoesUser) {
          assistant =
            "Understood—do you want to cancel now because the connection is down, or schedule for later?";
        }

        const updatedHistory = trimMessageHistory([
          ...messagesRef.current,
          { role: "agent", text: assistant },
        ]);
        setMessages(updatedHistory);
        messagesRef.current = updatedHistory;
      } catch (error) {
        console.error(error);
        const fallbackHistory = trimMessageHistory([
          ...messagesRef.current,
          {
            role: "agent",
            text: "I'm having trouble responding right now. Could you try again in a moment?",
          },
        ]);
        setMessages(fallbackHistory);
        messagesRef.current = fallbackHistory;
      } finally {
        setLoading(false);
      }
    },
    [ensureGenerator]
  );

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!loading) {
        void sendMessage(input);
      }
    },
    [input, loading, sendMessage]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (!loading) {
          void sendMessage(input);
        }
      }
    },
    [input, loading, sendMessage]
  );

  return (
    <div className="app">
      <header className="app__header">
        <h1>Cancellation Assistant</h1>
        <p className="app__subtitle">Let’s work through the best way to end your service.</p>
      </header>
      <main className="chat" aria-live="polite">
        <ul className="chat__messages">
          {messages.map((message, index) => (
            <li key={`${message.role}-${index}`} className={`chat__message chat__message--${message.role}`}>
              <span className="chat__author">{message.role === "agent" ? "Agent" : "You"}</span>
              <p>{message.text}</p>
            </li>
          ))}
          {loading ? (
            <li className="chat__message chat__message--agent chat__message--loading">
              <span className="chat__author">Agent</span>
              <div className="chat__typing" aria-label="Agent is typing">
                <span />
                <span />
                <span />
              </div>
              <p>Agent is thinking…</p>
            </li>
          ) : null}
          <li ref={endOfMessagesRef} />
        </ul>
      </main>
      <form className="input" onSubmit={handleSubmit}>
        <label htmlFor="chat-input" className="sr-only">
          Type your response
        </label>
        <textarea
          id="chat-input"
          rows={2}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your response here"
          disabled={loading}
          aria-disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
