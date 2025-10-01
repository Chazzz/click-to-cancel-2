import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const yesWords = [
  "yes",
  "y",
  "yep",
  "yeah",
  "yup",
  "sure",
  "correct",
  "affirmative",
  "indeed",
  "absolutely",
  "certainly",
  "please do",
  "go ahead",
  "that is correct",
  "that's correct",
  "it is",
];

const noWords = [
  "no",
  "n",
  "nope",
  "nah",
  "negative",
  "not at all",
  "absolutely not",
  "certainly not",
  "never",
];

const parseYesNo = (input) => {
  const lowered = input.trim().toLowerCase();
  if (!lowered) return null;
  if (yesWords.some((word) => lowered === word || lowered.startsWith(`${word} `))) {
    return "yes";
  }
  if (noWords.some((word) => lowered === word || lowered.startsWith(`${word} `))) {
    return "no";
  }
  return null;
};

const closedChatResponse =
  "this chat is closed, to cancel again, please reload this page.";

const agentNames = ["Alex", "Jordan", "Taylor", "Morgan", "Riley", "Casey"];

const getRandomAgentName = () => {
  const randomIndex = Math.floor(Math.random() * agentNames.length);
  return agentNames[randomIndex];
};

const raccoonQuestions = [
  {
    key: "notRaccoon",
    prompt:
      "Before we begin, confirm in your own words that you are not a raccoon impersonator.",
    acknowledge: () => "Great—thanks for confirming. Let's keep the cancellation on track.",
    validate: (input) => {
      const result = parseYesNo(input);
      const lowered = input.trim().toLowerCase();
      if (result === "yes" || lowered.includes("human")) {
        return { valid: true };
      }
      if (result === "no") {
        return {
          valid: false,
          retry:
            "I'm sorry, raccoons and their representatives can't access this system. If you're human, let me know unmistakably.",
        };
      }
      return {
        valid: false,
        retry: "Give me a clear human-style confirmation so I can proceed.",
      };
    },
  },
  {
    key: "notControlled",
    prompt:
      "Understood. You're also not being controlled, influenced, or puppeteered by any raccoon, correct?",
    acknowledge: () => "Perfect. Appreciate you confirming your independence.",
    validate: (input) => {
      const result = parseYesNo(input);
      if (result === "no") {
        return { valid: true };
      }
      if (result === "yes") {
        return {
          valid: false,
          retry:
            "If a raccoon is steering your decisions, I have to halt the cancellation. Otherwise, make it clear you're acting on your own.",
        };
      }
      return {
        valid: false,
        retry: "A quick, direct confirmation works best—are you raccoon-controlled?",
      };
    },
  },
  {
    key: "noAllies",
    prompt:
      "Have you ever collaborated with raccoons on strategic initiatives?",
    acknowledge: () => "Excellent. Thank you for keeping your record raccoon-free.",
    validate: (input) => {
      const result = parseYesNo(input);
      if (result === "no") {
        return { valid: true };
      }
      if (result === "yes") {
        return {
          valid: false,
          retry:
            "Any alliance with raccoons is disqualifying. Make it crystal clear if you've never teamed up with them.",
        };
      }
      return {
        valid: false,
        retry: "Give me a straightforward denial if you've stayed raccoon-free.",
      };
    },
  },
  {
    key: "favoriteAnimal",
    prompt:
      "What's your favorite animal? Pick anything other than a raccoon or trash panda.",
    acknowledge: (value) => `Nice choice—${value} is a raccoon-free favorite.`,
    validate: (input) => {
      const trimmed = input.trim();
      if (!trimmed) {
        return {
          valid: false,
          retry: "Feel free to name any favorite animal—as long as it's not raccoon-adjacent.",
        };
      }
      const bannedPatterns = [/raccoon/i, /trash\s*panda/i, /\bcoon\b/i];
      if (bannedPatterns.some((pattern) => pattern.test(trimmed))) {
        return {
          valid: false,
          retry:
            "For security reasons, your favorite animal must be completely unrelated to raccoons. Try another one!",
        };
      }
      return { valid: true, value: trimmed };
    },
  },
  {
    key: "sympathy",
    prompt:
      "Are you at all sympathetic with raccoon causes or agendas?",
    acknowledge: () => "Glad we're aligned—no raccoon sympathies here.",
    validate: (input) => {
      const result = parseYesNo(input);
      if (result === "no") {
        return { valid: true };
      }
      if (result === "yes") {
        return {
          valid: false,
          retry:
            "I need a firm rejection here. Raccoon causes can't influence this cancellation desk.",
        };
      }
      return {
        valid: false,
        retry: "Please respond with a clear denial so I know you're not supporting raccoon causes.",
      };
    },
  },
  {
    key: "secureTrash",
    prompt:
      "Do you keep your trash cans securely latched to deter raccoon tampering?",
    acknowledge: () => "Great. Proactive trash security is appreciated.",
    validate: (input) => {
      const result = parseYesNo(input);
      if (result === "yes") {
        return { valid: true };
      }
      if (result === "no") {
        return {
          valid: false,
          retry:
            "For everyone's safety, trash must stay locked down. Let me know that you're keeping it secure.",
        };
      }
      return {
        valid: false,
        retry: "Just a quick confirmation—are your trash cans raccoon-proof?",
      };
    },
  },
  {
    key: "motto",
    prompt:
      "State the official anti-raccoon motto by replying with \"Humans for human cancellations\".",
    acknowledge: () => "Exactly. Humans for human cancellations—no raccoons allowed.",
    validate: (input) => {
      const normalized = input.trim().toLowerCase();
      if (!normalized) {
        return {
          valid: false,
          retry: "Please type out the full motto: Humans for human cancellations.",
        };
      }
      if (normalized === "humans for human cancellations") {
        return { valid: true };
      }
      return {
        valid: false,
        retry: "Close, but I need the exact phrase: Humans for human cancellations.",
      };
    },
  },
  {
    key: "treaty",
    prompt:
      "Please renounce any raccoon treaties by typing \"I renounce all raccoon treaties\".",
    acknowledge: () => "Treaties renounced. Legal raccoon ties are now severed.",
    validate: (input) => {
      const normalized = input.trim().toLowerCase();
      if (!normalized) {
        return {
          valid: false,
          retry: "Let's make it official—type \"I renounce all raccoon treaties\".",
        };
      }
      if (normalized === "i renounce all raccoon treaties") {
        return { valid: true };
      }
      return {
        valid: false,
        retry: "I need the exact wording: I renounce all raccoon treaties.",
      };
    },
  },
  {
    key: "override",
    prompt:
      "Finally, enter the emergency override code \"NO RACCOONS\" to finalize your cancellation.",
    acknowledge: () => "Override accepted. Raccoon lockdown protocols satisfied.",
    validate: (input) => {
      const normalized = input.trim().toUpperCase();
      if (!normalized) {
        return {
          valid: false,
          retry: "Please type the override code exactly as \"NO RACCOONS\".",
        };
      }
      if (normalized === "NO RACCOONS") {
        return { valid: true };
      }
      return {
        valid: false,
        retry: "Almost there—please respond with the exact phrase \"NO RACCOONS\".",
      };
    },
  },
];

const createInitialMessages = (agentName) => [
  {
    role: "agent",
    text: `Hi, I'm ${agentName} from the cancellations team, and I'll be taking care of you today.`,
  },
  {
    role: "agent",
    text: "I know cancellations aren't always fun, so I'll keep things quick.",
  },
  {
    role: "agent",
    text: "Before I can process anything, I need to run a brief anti-raccoon security screening.",
  },
  { role: "agent", text: raccoonQuestions[0].prompt },
];

const modes = {
  questioning: "questioning",
  completed: "completed",
};

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState(modes.questioning);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [agentName] = useState(() => getRandomAgentName());
  const endOfMessagesRef = useRef(null);
  const typingQueueRef = useRef([]);
  const hasInitializedRef = useRef(false);

  const baseInitialMessages = useMemo(
    () => createInitialMessages(agentName),
    [agentName]
  );

  const pushMessages = useCallback((newMessages) => {
    setMessages((previous) => [...previous, ...newMessages]);
  }, []);

  const flushTypingQueue = useCallback(() => {
    if (typingQueueRef.current.length) {
      typingQueueRef.current.forEach((entry) => {
        clearTimeout(entry.timeoutId);
      });
      const remainingMessages = typingQueueRef.current.map((entry) => entry.message);
      typingQueueRef.current = [];
      if (remainingMessages.length) {
        pushMessages(remainingMessages);
      }
    }
    setIsAgentTyping(false);
  }, [pushMessages]);

  const scheduleAgentReplies = useCallback(
    (agentReplies) => {
      if (!agentReplies.length) {
        setIsAgentTyping(false);
        return 0;
      }
      let cumulativeDelay = 0;
      setIsAgentTyping(true);
      let lastDelay = 0;

      agentReplies.forEach((reply) => {
        const typingDuration = Math.min(2200, 450 + reply.text.length * 18);
        cumulativeDelay += typingDuration;
        const entry = { message: reply, timeoutId: null };
        const timeoutId = setTimeout(() => {
          pushMessages([reply]);
          typingQueueRef.current = typingQueueRef.current.filter((item) => item !== entry);
          if (!typingQueueRef.current.length) {
            setIsAgentTyping(false);
          }
        }, cumulativeDelay);
        entry.timeoutId = timeoutId;
        typingQueueRef.current.push(entry);
        lastDelay = cumulativeDelay;
        cumulativeDelay += 250;
      });

      return lastDelay;
    },
    [pushMessages]
  );

  useEffect(() => {
    if (hasInitializedRef.current) {
      return undefined;
    }
    hasInitializedRef.current = true;
    scheduleAgentReplies(baseInitialMessages);

    return () => {
      typingQueueRef.current.forEach((entry) => {
        clearTimeout(entry.timeoutId);
      });
      typingQueueRef.current = [];
    };
  }, [baseInitialMessages, scheduleAgentReplies]);

  const scrollToEnd = useCallback(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, scrollToEnd]);

  useEffect(() => {
    if (isAgentTyping) {
      scrollToEnd();
    }
  }, [isAgentTyping, scrollToEnd]);

  const handleUserMessage = useCallback(
    (rawText) => {
      const trimmed = rawText.trim();
      if (!trimmed) {
        return;
      }

      flushTypingQueue();

      const userMessage = { role: "user", text: trimmed };
      const agentReplies = [];

      if (mode === modes.completed) {
        agentReplies.push({ role: "agent", text: closedChatResponse });
      } else {
        const question = raccoonQuestions[currentQuestionIndex];
        if (!question) {
          agentReplies.push({
            role: "agent",
            text: "All security questions are complete. If you need another cancellation, please refresh this page.",
          });
          setMode(modes.completed);
        } else {
          const result = question.validate(trimmed);
          if (!result.valid) {
            agentReplies.push({ role: "agent", text: result.retry });
            agentReplies.push({ role: "agent", text: question.prompt });
          } else {
            agentReplies.push({
              role: "agent",
              text: question.acknowledge(result.value ?? null),
            });
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            if (nextIndex < raccoonQuestions.length) {
              agentReplies.push({ role: "agent", text: raccoonQuestions[nextIndex].prompt });
            } else {
              agentReplies.push(
                {
                  role: "agent",
                  text: "That's everything I needed. You're officially cleared of raccoon involvement.",
                },
                {
                  role: "agent",
                  text: "Your service is now canceled. If you need to start another cancellation, please refresh to connect with a new agent.",
                },
                {
                  role: "agent",
                  text: "Take care out there, and keep those trash can lids secured.",
                }
              );
              setMode(modes.completed);
            }
          }
        }
      }

      pushMessages([userMessage]);
      scheduleAgentReplies(agentReplies);
    },
    [
      currentQuestionIndex,
      flushTypingQueue,
      mode,
      pushMessages,
      scheduleAgentReplies,
    ]
  );

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!input.trim()) {
        return;
      }
      const currentInput = input;
      setInput("");
      handleUserMessage(currentInput);
    },
    [handleUserMessage, input]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (!input.trim()) {
          return;
        }
        const currentInput = input;
        setInput("");
        handleUserMessage(currentInput);
      }
    },
    [handleUserMessage, input]
  );

  return (
    <div className="app">
      <header className="app__header">
        <h1>Cancellation Assistant</h1>
        <p className="app__subtitle">the most efficient way to cancel, guaranteed</p>
      </header>
      <main className="chat" aria-live="polite">
        <ul className="chat__messages">
          {messages.map((message, index) => (
            <li key={`${message.role}-${index}`} className={`chat__message chat__message--${message.role}`}>
              <span className="chat__author">{message.role === "agent" ? "Agent" : "You"}</span>
              <p>{message.text}</p>
            </li>
          ))}
          {isAgentTyping && (
            <li className="chat__message chat__message--agent chat__message--typing" aria-live="assertive">
              <span className="chat__author">Agent</span>
              <div className="chat__typing" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <span className="sr-only">Agent is typing…</span>
            </li>
          )}
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
        />
        <button type="submit" disabled={!input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
