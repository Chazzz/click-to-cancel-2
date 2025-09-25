import { useCallback, useEffect, useRef, useState } from "react";
import PongChallenge from "./PongChallenge";

const monthNames = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const capitalizeWords = (value) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatDate = (date) =>
  date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const extractAccountName = (input) => {
  const cleaned = input.replace(/[^a-zA-Z\s'\-.]/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  const words = cleaned
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (/^(mc)([a-z])/i.test(word)) {
        return word.replace(/^mc([a-z])(.+)/i, (_, first, rest) => `Mc${first.toUpperCase()}${rest.toLowerCase()}`);
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
  if (!words.length) return null;
  return words.join(" ");
};

const extractServiceType = (input) => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const lowered = trimmed.toLowerCase();
  const options = [
    { label: "Internet", patterns: ["internet", "wifi", "broadband"] },
    { label: "Cable TV", patterns: ["tv", "television", "cable"] },
    { label: "Mobile phone", patterns: ["mobile", "cell", "wireless", "cellphone", "cell phone"] },
    { label: "Home phone", patterns: ["landline", "home phone", "voip", "phone line"] },
    { label: "Security system", patterns: ["security", "alarm", "monitoring"] },
    { label: "Streaming", patterns: ["stream", "app", "channel"] },
  ];

  for (const option of options) {
    if (option.patterns.some((pattern) => lowered.includes(pattern))) {
      return option.label;
    }
  }

  if (trimmed.length < 3) return null;
  return capitalizeWords(trimmed);
};

const extractReason = (input) => {
  const trimmed = input.trim();
  if (trimmed.length < 3) return null;
  return trimmed.replace(/\s+/g, " ");
};

const extractCancellationDate = (input) => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const lowered = trimmed.toLowerCase();
  const now = new Date();

  if (/asap|soon|immediately/.test(lowered)) {
    return "As soon as possible";
  }
  if (/today/.test(lowered)) {
    return formatDate(now);
  }
  if (/tomorrow/.test(lowered)) {
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return formatDate(tomorrow);
  }
  if (/next (billing|cycle)/.test(lowered)) {
    return "Next billing cycle";
  }
  if (/end of (?:the )?month/.test(lowered)) {
    return "End of the month";
  }

  const monthRegex = new RegExp(
    `\\b(${monthNames.join("|")})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?`,
    "i"
  );
  const monthMatch = trimmed.match(monthRegex);
  if (monthMatch) {
    const [, monthName, day, year] = monthMatch;
    const monthIndex = monthNames.indexOf(monthName.toLowerCase());
    const parsedYear = year ? parseInt(year, 10) : now.getFullYear();
    const parsedDay = parseInt(day, 10);
    if (!Number.isNaN(parsedDay) && monthIndex >= 0) {
      const parsedDate = new Date(parsedYear, monthIndex, parsedDay);
      if (!Number.isNaN(parsedDate.getTime())) {
        return formatDate(parsedDate);
      }
    }
  }

  const numericMatch = trimmed.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (numericMatch) {
    const [, month, day, year] = numericMatch;
    const monthNumber = parseInt(month, 10) - 1;
    const dayNumber = parseInt(day, 10);
    const yearNumber = year ? parseInt(year.length === 2 ? `20${year}` : year, 10) : now.getFullYear();
    const parsedDate = new Date(yearNumber, monthNumber, dayNumber);
    if (!Number.isNaN(parsedDate.getTime())) {
      return formatDate(parsedDate);
    }
  }

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return formatDate(new Date(parsed));
  }

  return null;
};

const extractEquipmentStatus = (input) => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const lowered = trimmed.toLowerCase();

  if (/^(?:no|nope|none)(?:\b|$)/.test(lowered) || /already (?:sent|returned)/.test(lowered)) {
    return "No equipment needs to be returned.";
  }
  if (/^(?:yes|yep|yeah)(?:\b|$)/.test(lowered)) {
    return "Customer still has equipment to return.";
  }
  if (/modem|router|box|equipment|device|return|drop off|ship/i.test(lowered)) {
    const sentence = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    return sentence.endsWith(".") ? sentence : `${sentence}.`;
  }

  return null;
};

const formatPhoneNumber = (value) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return value.trim();
};

const extractContactMethod = (input) => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const emailMatch = trimmed.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (emailMatch) {
    return emailMatch[0].toLowerCase();
  }
  const phoneMatch = trimmed.match(/\+?\d[\d\s().-]{6,}\d/);
  if (phoneMatch) {
    return formatPhoneNumber(phoneMatch[0]);
  }
  return null;
};

const cancellationScript = [
  {
    key: "accountName",
    label: "account holder's name",
    question: "To get started, could I have the full name on the account?",
    retry:
      "I'm sorry, I want to make sure I have the account holder's full name exactly as it appears on the account. Could you share it again?",
    acknowledge: (value) => `Thanks, ${value}. I've noted the account holder's name.`,
    extract: extractAccountName,
    format: (value) => value,
  },
  {
    key: "serviceType",
    label: "service you're cancelling",
    question: "Which service are you looking to cancel today (internet, TV, mobile, etc.)?",
    retry:
      "Just to confirm, which of your services should I cancel—like internet, TV, or wireless?",
    acknowledge: (value) => `Got it—you'd like to cancel your ${value} service.`,
    extract: extractServiceType,
    format: (value) => value,
  },
  {
    key: "cancellationReason",
    label: "cancellation reason",
    question: "What's the main reason you're looking to cancel?",
    retry: "I want to be sure I capture the reason correctly. Could you tell me a bit more about why you're cancelling?",
    acknowledge: (value) => `Thanks for the context—I've noted that you're cancelling because ${value}.`,
    extract: extractReason,
    format: (value) => value,
  },
  {
    key: "cancellationDate",
    label: "cancellation date",
    question: "When would you like the cancellation to take effect?",
    retry: "I'm not sure I caught the date you prefer. Could you share the exact day you'd like us to schedule the cancellation?",
    acknowledge: (value) => `Understood. I'll target ${value} for the cancellation.`,
    extract: extractCancellationDate,
    format: (value) => value,
  },
  {
    key: "equipmentStatus",
    label: "equipment return status",
    question: "Do you still have any company equipment (like a modem or cable box) that needs to be returned?",
    retry:
      "I want to make sure we handle any equipment properly. Do you still have anything from us that needs to go back?",
    acknowledge: (value) => `Thanks for confirming about the equipment: ${value}.`,
    extract: extractEquipmentStatus,
    format: (value) => value,
  },
  {
    key: "contactMethod",
    label: "best contact method",
    question: "What's the best phone number or email to reach you once the cancellation is processed?",
    retry:
      "I want to be sure I have the right contact info. Could you share the phone number or email we should use for updates?",
    acknowledge: (value) => `Perfect, we'll reach out at ${value} if we need to follow up.`,
    extract: extractContactMethod,
    format: (value) => value,
  },
];

const scriptByKey = Object.fromEntries(cancellationScript.map((step) => [step.key, step]));

const confirmPrompt =
  "Does everything look correct? Reply \"yes\" to confirm or let me know what needs to change.";

const formatSummary = (data) => {
  const lines = [
    `• Account holder: ${data.accountName ?? "—"}`,
    `• Service: ${data.serviceType ?? "—"}`,
    `• Reason: ${data.cancellationReason ?? "—"}`,
    `• Cancellation date: ${data.cancellationDate ?? "—"}`,
    `• Equipment: ${data.equipmentStatus ?? "—"}`,
    `• Follow-up contact: ${data.contactMethod ?? "—"}`,
  ];
  return `Here's what I've captured:\n${lines.join("\n")}`;
};

const yesWords = [
  "yes",
  "y",
  "yep",
  "yeah",
  "correct",
  "looks good",
  "that's right",
  "that is right",
  "confirm",
  "confirmed",
  "please proceed",
];

const noWords = [
  "no",
  "n",
  "nope",
  "not yet",
  "incorrect",
  "that's wrong",
  "needs change",
  "change",
  "update",
];

const parseYesNo = (input) => {
  const lowered = input.trim().toLowerCase();
  if (!lowered) return null;
  if (yesWords.some((word) => lowered === word || lowered.includes(word))) {
    return "yes";
  }
  if (noWords.some((word) => lowered === word || lowered.includes(word))) {
    return "no";
  }
  return null;
};

const fieldSynonyms = {
  accountName: ["name", "account", "account holder", "customer"],
  serviceType: ["service", "plan", "package"],
  cancellationReason: ["reason", "why", "cause", "because"],
  cancellationDate: ["date", "when", "schedule", "effective"],
  equipmentStatus: ["equipment", "modem", "router", "hardware", "devices", "box"],
  contactMethod: ["contact", "phone", "email", "reach", "number"],
};

const identifyField = (input) => {
  const lowered = input.toLowerCase();
  for (const [key, synonyms] of Object.entries(fieldSynonyms)) {
    if (synonyms.some((word) => lowered.includes(word))) {
      return key;
    }
  }
  return null;
};

const initialMessages = [
  {
    role: "agent",
    text: "Hi there—you're through to the cancellations team. I'll guide you through a few quick questions so we can wrap this up.",
  },
  { role: "agent", text: cancellationScript[0].question },
];

const modes = {
  collecting: "collecting",
  confirm: "confirm",
  correctionSelect: "correction-select",
  correctionInput: "correction-input",
  completed: "completed",
  pong: "pong",
};

export default function App() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [mode, setMode] = useState(modes.collecting);
  const [pendingField, setPendingField] = useState(null);
  const endOfMessagesRef = useRef(null);

  const pushMessages = useCallback((newMessages) => {
    setMessages((previous) => [...previous, ...newMessages]);
  }, []);

  const handlePongVictory = useCallback(() => {
    pushMessages([
      {
        role: "agent",
        text: "Alright, you got me—that was some sharp reflexes!",
      },
      {
        role: "agent",
        text: "I'll submit the cancellation with those details and send a confirmation to your contact on file. Is there anything else I can do for you today?",
      },
    ]);
    setMode(modes.completed);
  }, [pushMessages]);

  const handlePongRematch = useCallback(() => {
    setFormData({});
    setStepIndex(0);
    setPendingField(null);
    setMode(modes.collecting);
    pushMessages([
      {
        role: "agent",
        text: "Nice try! I took that round—those on-screen arrow buttons can be sneaky.",
      },
      {
        role: "agent",
        text: "Let's start fresh so I capture everything correctly.",
      },
      { role: "agent", text: cancellationScript[0].question },
    ]);
  }, [pushMessages, setFormData, setMode, setPendingField, setStepIndex]);

  const scrollToEnd = useCallback(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, scrollToEnd]);

  const handleUserMessage = useCallback(
    (rawText) => {
      const trimmed = rawText.trim();
      if (!trimmed) return;

      const userMessage = { role: "user", text: trimmed };
      const agentReplies = [];
      let updatedData = formData;
      let dataChanged = false;
      let nextStepIndex = stepIndex;
      let nextMode = mode;
      let nextPendingField = pendingField;

      const appendSummaryAndPrompt = (data) => {
        agentReplies.push({ role: "agent", text: formatSummary(data) });
        agentReplies.push({ role: "agent", text: confirmPrompt });
      };

      const addRetry = (step) => {
        agentReplies.push({ role: "agent", text: step.retry });
      };

      const handleSuccessfulCapture = (step, value) => {
        const formatted = step.format(value);
        updatedData = { ...updatedData, [step.key]: formatted };
        dataChanged = true;
        agentReplies.push({ role: "agent", text: step.acknowledge(formatted) });
      };

      if (mode === modes.collecting) {
        const step = cancellationScript[stepIndex];
        const extraction = step.extract(trimmed);
        if (!extraction) {
          addRetry(step);
        } else {
          handleSuccessfulCapture(step, extraction);
          nextStepIndex = stepIndex + 1;
          if (nextStepIndex < cancellationScript.length) {
            agentReplies.push({ role: "agent", text: cancellationScript[nextStepIndex].question });
          } else {
            appendSummaryAndPrompt(updatedData);
            nextMode = modes.confirm;
          }
        }
      } else if (mode === modes.confirm) {
        const yesNo = parseYesNo(trimmed);
        if (yesNo === "yes") {
          agentReplies.push({
            role: "agent",
          text: "Before I lock this in, you'll need to beat me in a quick game of Pong. Use the on-screen arrow buttons to move your paddle!",
          });
          nextMode = modes.pong;
        } else if (yesNo === "no") {
          agentReplies.push({
            role: "agent",
            text: "No problem! Which detail should we adjust—name, service, reason, date, equipment, or contact?",
          });
          nextMode = modes.correctionSelect;
        } else {
          const fieldKey = identifyField(trimmed);
          if (fieldKey) {
            const step = scriptByKey[fieldKey];
            const extraction = step.extract(trimmed);
            if (extraction) {
              handleSuccessfulCapture(step, extraction);
              appendSummaryAndPrompt(updatedData);
            } else {
              agentReplies.push({
                role: "agent",
                text: `I heard that you'd like to adjust the ${step.label}. Could you share the updated information?`,
              });
              nextMode = modes.correctionInput;
              nextPendingField = fieldKey;
            }
          } else {
            agentReplies.push({
              role: "agent",
              text: "Just to double-check, please reply \"yes\" if everything looks right, or tell me what needs to change.",
            });
          }
        }
      } else if (mode === modes.pong) {
        agentReplies.push({
          role: "agent",
          text: "The match is still on—use the on-screen arrow buttons on the Pong board to move your paddle and snag the win!",
        });
      } else if (mode === modes.correctionSelect) {
        const fieldKey = identifyField(trimmed);
        if (!fieldKey) {
          agentReplies.push({
            role: "agent",
            text: "I'm sorry, I didn't catch which detail you'd like to change. You can say something like \"change the service\" or \"update the date\".",
          });
        } else {
          const step = scriptByKey[fieldKey];
          const extraction = step.extract(trimmed);
          if (extraction) {
            handleSuccessfulCapture(step, extraction);
            appendSummaryAndPrompt(updatedData);
            nextMode = modes.confirm;
            nextPendingField = null;
          } else {
            agentReplies.push({
              role: "agent",
              text: `Sure—let's update the ${step.label}. ${step.question}`,
            });
            nextMode = modes.correctionInput;
            nextPendingField = fieldKey;
          }
        }
      } else if (mode === modes.correctionInput && pendingField) {
        const step = scriptByKey[pendingField];
        const extraction = step.extract(trimmed);
        if (!extraction) {
          agentReplies.push({
            role: "agent",
            text: `Thanks for sticking with me—I'm still not sure I understood. ${step.retry}`,
          });
        } else {
          handleSuccessfulCapture(step, extraction);
          appendSummaryAndPrompt(updatedData);
          nextMode = modes.confirm;
          nextPendingField = null;
        }
      } else if (mode === modes.completed) {
        const fieldKey = identifyField(trimmed);
        if (fieldKey) {
          const step = scriptByKey[fieldKey];
          const extraction = step.extract(trimmed);
          if (extraction) {
            agentReplies.push({
              role: "agent",
              text: "Absolutely—we can still make that adjustment before it's finalized.",
            });
            handleSuccessfulCapture(step, extraction);
            appendSummaryAndPrompt(updatedData);
            nextMode = modes.confirm;
          } else {
            agentReplies.push({
              role: "agent",
              text: `Happy to help. What's the correct ${step.label}?`,
            });
            nextMode = modes.correctionInput;
            nextPendingField = fieldKey;
          }
        } else {
          agentReplies.push({
            role: "agent",
            text: "Everything is already scheduled, but if something needs to change just let me know which detail to update.",
          });
        }
      }

      pushMessages([userMessage, ...agentReplies]);

      if (dataChanged) {
        setFormData(updatedData);
      }
      if (nextStepIndex !== stepIndex) {
        setStepIndex(nextStepIndex);
      }
      if (nextMode !== mode) {
        setMode(nextMode);
      }
      if (nextPendingField !== pendingField) {
        setPendingField(nextPendingField);
      }
    },
    [formData, mode, pendingField, pushMessages, stepIndex]
  );

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
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
          <li ref={endOfMessagesRef} />
        </ul>
      </main>
      {mode === modes.pong && (
        <PongChallenge onPlayerWin={handlePongVictory} onAgentWin={handlePongRematch} />
      )}
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
