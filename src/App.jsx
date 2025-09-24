import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const initialPrompt = "Why do you want to cancel?";

export default function App() {
  const [messages, setMessages] = useState([{ role: "agent", text: initialPrompt }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const generatorRef = useRef(null);
  const endOfMessagesRef = useRef(null);

  const ensureGenerator = useCallback(async () => {
    if (!generatorRef.current) {
      const { pipeline } = await import("@xenova/transformers");
      generatorRef.current = await pipeline("text-generation", "Xenova/distilgpt2");
    }
    return generatorRef.current;
  }, []);

  const conversationString = useMemo(() => {
    return messages
      .map((message) => `${message.role === "agent" ? "Agent" : "You"}: ${message.text}`)
      .join("\n");
  }, [messages]);

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

      setMessages((current) => [...current, { role: "user", text: trimmed }]);
      setInput("");
      setLoading(true);

      try {
        const generator = await ensureGenerator();
        const prompt = `${conversationString}\nYou: ${trimmed}`;
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
        console.error(error);
        setMessages((current) => [
          ...current,
          {
            role: "agent",
            text: "I'm having trouble responding right now. Could you try again in a moment?",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [conversationString, ensureGenerator]
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
