import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  if (lowered === "now" || /^right now$/.test(lowered)) {
    return formatDate(now);
  }
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
    guidance: "Please reply with the complete first and last name on the account, without extra details.",
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
    guidance: "Let me know the single service type, such as \"internet\", \"cable TV\", or \"mobile phone\".",
    acknowledge: (value) => `Got it—you'd like to cancel your ${value} service.`,
    extract: extractServiceType,
    format: (value) => value,
  },
  {
    key: "cancellationReason",
    label: "cancellation reason",
    question: "What's the main reason you're looking to cancel?",
    retry: "I want to be sure I capture the reason correctly. Could you tell me a bit more about why you're cancelling?",
    guidance: "A short explanation like \"moving out of state\" or \"too expensive\" works great.",
    acknowledge: (value) => `Thanks for the context—I've noted that you're cancelling because ${value}.`,
    extract: extractReason,
    format: (value) => value,
  },
  {
    key: "cancellationDate",
    label: "cancellation date",
    question: "When would you like the cancellation to take effect?",
    retry: "I'm not sure I caught the date you prefer. Could you share the exact day you'd like us to schedule the cancellation?",
    guidance:
      "You can give a specific date like \"March 15\" or use timing such as \"next billing cycle\" or \"as soon as possible\".",
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
    guidance:
      "Please answer yes or no about having equipment, like \"no, nothing to return\" or \"yes, I still have the modem to send back.\"",
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
    guidance: "Share one phone number (e.g., 555-123-4567) or an email address like name@example.com.",
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

const hardModeScenarios = [
  {
    accountName: "Jordan McAllister",
    serviceType: "Internet",
    cancellationReason: "Relocating our headquarters to Phoenix, Arizona.",
    cancellationDate: "September 25, 2025",
    equipmentStatus: "Still have the modem and security gateway to return.",
    contactMethod: "jordan.mcallister@acmecorp.com",
  },
];

const getRandomHardScenario = () => {
  if (!hardModeScenarios.length) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * hardModeScenarios.length);
  return hardModeScenarios[randomIndex];
};

const normalizeForComparison = (key, value) => {
  if (!value) return "";
  let normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  if (key !== "contactMethod") {
    normalized = normalized.replace(/\.+$/, "");
  }
  return normalized;
};

const modes = {
  collecting: "collecting",
  confirm: "confirm",
  correctionSelect: "correction-select",
  correctionInput: "correction-input",
  completed: "completed",
  pongPending: "pong-pending",
  pong: "pong",
};

const closedChatResponse =
  "this chat is closed, to cancel again, please reload this page.";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [mode, setMode] = useState(modes.collecting);
  const [pendingField, setPendingField] = useState(null);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [difficulty, setDifficulty] = useState(null);
  const [hardScenario, setHardScenario] = useState(() => getRandomHardScenario());
  const endOfMessagesRef = useRef(null);
  const typingQueueRef = useRef([]);
  const pongActivationTimeoutRef = useRef(null);

  const hardModeNormalized = useMemo(() => {
    if (!hardScenario) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(hardScenario).map(([key, value]) => [key, normalizeForComparison(key, value)])
    );
  }, [hardScenario]);

  const hardScenarioDetails = useMemo(() => {
    if (!hardScenario) {
      return [];
    }
    return [
      ["Account holder", hardScenario.accountName],
      ["Service", hardScenario.serviceType],
      ["Reason", hardScenario.cancellationReason],
      ["Effective date", hardScenario.cancellationDate],
      ["Equipment", hardScenario.equipmentStatus],
      ["Contact", hardScenario.contactMethod],
    ];
  }, [hardScenario]);

  const pushMessages = useCallback((newMessages) => {
    setMessages((previous) => [...previous, ...newMessages]);
  }, []);

  const clearPongActivationTimeout = useCallback(() => {
    if (pongActivationTimeoutRef.current) {
      clearTimeout(pongActivationTimeoutRef.current);
      pongActivationTimeoutRef.current = null;
    }
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

    if (pongActivationTimeoutRef.current && mode === modes.pongPending) {
      clearPongActivationTimeout();
      setMode(modes.pong);
    }
  }, [clearPongActivationTimeout, mode, pushMessages]);

  const scheduleAgentReplies = useCallback(
    (agentReplies, options = {}) => {
      if (!agentReplies.length) {
        setIsAgentTyping(false);
        return 0;
      }

      const { initialDelay = 0 } = options;
      let cumulativeDelay = initialDelay;
      setIsAgentTyping(true);
      let lastMessageDelay = 0;

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
        lastMessageDelay = cumulativeDelay;
        cumulativeDelay += 250;
      });
      return lastMessageDelay;
    },
    [pushMessages]
  );

  useEffect(() => {
    return () => {
      typingQueueRef.current.forEach((entry) => {
        clearTimeout(entry.timeoutId);
      });
      typingQueueRef.current = [];
      clearPongActivationTimeout();
    };
  }, [clearPongActivationTimeout]);

  const handlePongVictory = useCallback(() => {
    clearPongActivationTimeout();
    setIsAgentTyping(true);
    scheduleAgentReplies(
      [
        {
          role: "agent",
          text: "Alright, you got me—that was some sharp reflexes!",
        },
        {
          role: "agent",
          text: "I'll submit the cancellation with those details and send a confirmation to your contact on file. Is there anything else I can do for you today?",
        },
        {
        role: "agent",
        text: "Thank you for working with me today!",
        },
      ],
      { initialDelay: 900 }
    );
    setMode(modes.completed);
  }, [clearPongActivationTimeout, scheduleAgentReplies, setIsAgentTyping]);

  const handlePongRematch = useCallback(() => {
    clearPongActivationTimeout();
    setFormData({});
    setStepIndex(0);
    setPendingField(null);
    setMode(modes.collecting);
    setIsAgentTyping(true);
    scheduleAgentReplies(
      [
        {
          role: "agent",
          text: "Nice try! I took that round—those on-screen arrow buttons can be sneaky.",
        },
        {
          role: "agent",
          text: "Let's start fresh so I capture everything correctly.",
        },
        { role: "agent", text: cancellationScript[0].question },
      ],
      { initialDelay: 900 }
    );
  }, [
    clearPongActivationTimeout,
    scheduleAgentReplies,
    setFormData,
    setMode,
    setPendingField,
    setStepIndex,
    setIsAgentTyping,
  ]);

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
      if (!difficulty) return;
      const trimmed = rawText.trim();
      if (!trimmed) return;

      flushTypingQueue();

      const userMessage = { role: "user", text: trimmed };
      const agentReplies = [];
      let updatedData = formData;
      let dataChanged = false;
      let nextStepIndex = stepIndex;
      let nextMode = mode;
      let nextPendingField = pendingField;
      let shouldStartPongChallenge = false;
      const isHardMode = difficulty === "hard";

      const validateHardModeValue = (step, formatted) => {
        if (!isHardMode) return true;
        const expected = hardModeNormalized[step.key];
        if (!expected) return true;
        return normalizeForComparison(step.key, formatted) === expected;
      };

      const handleHardModeMismatch = (step) => {
        agentReplies.push({
          role: "agent",
          text: "Thanks for that, but it doesn't match any of the records I have for this account.",
        });
        const guidance = step.guidance ? ` ${step.guidance}` : "";
        agentReplies.push({ role: "agent", text: `${step.question}${guidance}` });
      };

      const appendSummaryAndPrompt = (data) => {
        agentReplies.push({ role: "agent", text: formatSummary(data) });
        agentReplies.push({ role: "agent", text: confirmPrompt });
      };

      const addRetry = (step) => {
        const guidance = step.guidance ? ` ${step.guidance}` : "";
        agentReplies.push({ role: "agent", text: `${step.retry}${guidance}` });
      };

      const handleSuccessfulCapture = (step, value, formattedValue) => {
        const formatted = formattedValue ?? step.format(value);
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
          const formatted = step.format(extraction);
          if (!validateHardModeValue(step, formatted)) {
            handleHardModeMismatch(step);
          } else {
            handleSuccessfulCapture(step, extraction, formatted);
            nextStepIndex = stepIndex + 1;
            if (nextStepIndex < cancellationScript.length) {
              agentReplies.push({ role: "agent", text: cancellationScript[nextStepIndex].question });
            } else {
              appendSummaryAndPrompt(updatedData);
              nextMode = modes.confirm;
            }
          }
        }
      } else if (mode === modes.confirm) {
        const yesNo = parseYesNo(trimmed);
        if (yesNo === "yes") {
          agentReplies.push({
            role: "agent",
            text: "Before I lock this in, you'll need to beat me in a quick game of Pong. Use the on-screen arrow buttons to move your paddle!",
          });
          nextMode = modes.pongPending;
          shouldStartPongChallenge = true;
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
              const formatted = step.format(extraction);
              if (!validateHardModeValue(step, formatted)) {
                handleHardModeMismatch(step);
              } else {
                handleSuccessfulCapture(step, extraction, formatted);
                appendSummaryAndPrompt(updatedData);
              }
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
      } else if (mode === modes.pong || mode === modes.pongPending) {
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
            const formatted = step.format(extraction);
            if (!validateHardModeValue(step, formatted)) {
              handleHardModeMismatch(step);
            } else {
              handleSuccessfulCapture(step, extraction, formatted);
              appendSummaryAndPrompt(updatedData);
              nextMode = modes.confirm;
              nextPendingField = null;
            }
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
            text: `Thanks for sticking with me—I'm still not sure I understood. ${step.retry}${step.guidance ? ` ${step.guidance}` : ""}`,
          });
        } else {
          const formatted = step.format(extraction);
          if (!validateHardModeValue(step, formatted)) {
            handleHardModeMismatch(step);
          } else {
            handleSuccessfulCapture(step, extraction, formatted);
            appendSummaryAndPrompt(updatedData);
            nextMode = modes.confirm;
            nextPendingField = null;
          }
        }
      } else if (mode === modes.completed) {
        agentReplies.push({ role: "agent", text: closedChatResponse });
      }

      pushMessages([userMessage]);
      const totalDelay = scheduleAgentReplies(agentReplies);

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
      if (shouldStartPongChallenge) {
        clearPongActivationTimeout();
        const safeDelay = typeof totalDelay === "number" && totalDelay > 0 ? totalDelay + 2800 : 4000;
        pongActivationTimeoutRef.current = setTimeout(() => {
          setMode(modes.pong);
          pongActivationTimeoutRef.current = null;
        }, safeDelay);
      }
    },
    [
      clearPongActivationTimeout,
      difficulty,
      flushTypingQueue,
      formData,
      hardModeNormalized,
      mode,
      pendingField,
      pushMessages,
      scheduleAgentReplies,
      stepIndex,
    ]
  );

  const handleModeSelection = useCallback(
    (selectedMode) => {
      clearPongActivationTimeout();
      flushTypingQueue();
      setIsAgentTyping(false);
      setDifficulty(selectedMode);
      setFormData({});
      setStepIndex(0);
      setMode(modes.collecting);
      setPendingField(null);
      setInput("");

      const startMessages = [...initialMessages];
      if (selectedMode === "easy") {
        startMessages.splice(1, 0, {
          role: "agent",
          text: "Admin override is enabled—share any account details you'd like me to cancel.",
        });
      } else if (selectedMode === "hard") {
        let scenarioForMode = hardScenario;
        if (!scenarioForMode) {
          scenarioForMode = getRandomHardScenario();
          setHardScenario(scenarioForMode);
        }
        startMessages.splice(1, 0, {
          role: "agent",
          text: "Thanks! I'll double-check every answer against the records provided, so please use the exact details.",
        });
        if (scenarioForMode) {
          const detailLines = [
            `• Account holder: ${scenarioForMode.accountName}`,
            `• Service: ${scenarioForMode.serviceType}`,
            `• Reason: ${scenarioForMode.cancellationReason}`,
            `• Effective date: ${scenarioForMode.cancellationDate}`,
            `• Equipment: ${scenarioForMode.equipmentStatus}`,
            `• Contact: ${scenarioForMode.contactMethod}`,
          ].join("\n");
          startMessages.splice(2, 0, {
            role: "agent",
            text: `Here's the account you'll be cancelling:\n${detailLines}`,
          });
        }
      }
      setMessages(startMessages);
    },
    [clearPongActivationTimeout, flushTypingQueue, hardScenario]
  );

  const isInputDisabled = !difficulty || mode === modes.pong || mode === modes.completed;

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (isInputDisabled) {
        return;
      }
      const currentInput = input;
      setInput("");
      handleUserMessage(currentInput);
    },
    [handleUserMessage, input, isInputDisabled]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (isInputDisabled) {
          return;
        }
        const currentInput = input;
        setInput("");
        handleUserMessage(currentInput);
      }
    },
    [handleUserMessage, input, isInputDisabled]
  );

  const chatClassName = `chat${!difficulty || mode === modes.pong ? " chat--overlay-active" : ""}`;

  return (
    <div className="app">
      <header className="app__header">
        <h1>Cancellation Assistant</h1>
        <p className="app__subtitle">Let’s work through the best way to end your service.</p>
      </header>
      <main className={chatClassName} aria-live="polite">
        <ul className="chat__messages" aria-hidden={!difficulty || mode === modes.pong}>
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
        {!difficulty && (
          <div className="chat__overlay" role="dialog" aria-modal="true" aria-label="Select difficulty">
            <div className="mode-overlay">
              <h2 className="mode-overlay__title">Choose your challenge</h2>
              <p className="mode-overlay__subtitle">Pick how you'd like to run today's cancellation.</p>
              <div className="mode-overlay__options">
                <section className="mode-card">
                  <header className="mode-card__header">
                    <span className="mode-card__eyebrow">Easy mode</span>
                    <h3>Quick sandbox</h3>
                  </header>
                  <p className="mode-card__highlight">Admin enabled</p>
                  <p className="mode-card__description">Cancel for whoever you like!</p>
                  <button
                    type="button"
                    className="mode-card__button"
                    onClick={() => handleModeSelection("easy")}
                  >
                    Start easy mode
                  </button>
                </section>
                <section className="mode-card mode-card--hard">
                  <header className="mode-card__header">
                    <span className="mode-card__eyebrow">Hard mode</span>
                    <h3>Records locked in</h3>
                  </header>
                  <p className="mode-card__description">
                    You'll need to match the exact account information below.
                  </p>
                  <ul className="mode-card__details">
                    {hardScenarioDetails.length ? (
                      hardScenarioDetails.map(([label, value]) => (
                        <li key={label}>
                          <strong>{label}:</strong> {value}
                        </li>
                      ))
                    ) : (
                      <li>
                        <em>Generating account details…</em>
                      </li>
                    )}
                  </ul>
                  <button
                    type="button"
                    className="mode-card__button"
                    onClick={() => handleModeSelection("hard")}
                  >
                    I'm ready for hard mode
                  </button>
                </section>
              </div>
            </div>
          </div>
        )}
        {mode === modes.pong && (
          <div className="chat__overlay" role="dialog" aria-modal="true" aria-label="Pong challenge">
            <PongChallenge onPlayerWin={handlePongVictory} onAgentWin={handlePongRematch} />
          </div>
        )}
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
          placeholder={difficulty ? "Type your response here" : "Select a mode to begin"}
          disabled={isInputDisabled}
        />
        <button type="submit" disabled={isInputDisabled || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
