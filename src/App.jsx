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
  "definitely",
  "without a doubt",
  "by all means",
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
  "no way",
  "not really",
];

const yesPatterns = [
  /\b(i am|i'm) human\b/,
  /\b(of course|for sure|sounds good)\b/,
  /\ball good\b/,
];

const noPatterns = [
  /\b(i am|i'm) not\b/,
  /\bno thanks\b/,
  /\bno way\b/,
  /\bi would never\b/,
];

const normalizeForPhraseMatch = (input) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const matchesWord = (text, word) => {
  const normalizedText = normalizeForPhraseMatch(text);
  const normalizedWord = normalizeForPhraseMatch(word);
  if (!normalizedText || !normalizedWord) {
    return false;
  }
  if (normalizedText === normalizedWord) {
    return true;
  }
  return (
    normalizedText.startsWith(`${normalizedWord} `) ||
    normalizedText.endsWith(` ${normalizedWord}`) ||
    normalizedText.includes(` ${normalizedWord} `)
  );
};

const parseYesNo = (input) => {
  const lowered = input.trim().toLowerCase();
  if (!lowered) return null;
  if (
    yesWords.some((word) => matchesWord(lowered, word)) ||
    yesPatterns.some((pattern) => pattern.test(lowered))
  ) {
    return "yes";
  }
  if (
    noWords.some((word) => matchesWord(lowered, word)) ||
    noPatterns.some((pattern) => pattern.test(lowered))
  ) {
    return "no";
  }
  return null;
};

const isCorrectResponse = (input) => {
  const lowered = input.trim().toLowerCase();
  if (!lowered) {
    return false;
  }
  const sanitized = lowered.replace(/[.!?]+$/, "");
  if (/(?:in|un)correct/.test(sanitized) || /not\s+correct/.test(sanitized)) {
    return false;
  }
  return /\bcorrect\b/.test(sanitized);
};

const containsPhrase = (input, phrase) => {
  const normalizedInput = normalizeForPhraseMatch(input);
  const normalizedPhrase = normalizeForPhraseMatch(phrase);
  if (!normalizedInput || !normalizedPhrase) {
    return false;
  }
  if (normalizedInput === normalizedPhrase) {
    return true;
  }
  return (
    normalizedInput.startsWith(`${normalizedPhrase} `) ||
    normalizedInput.endsWith(` ${normalizedPhrase}`) ||
    normalizedInput.includes(` ${normalizedPhrase} `)
  );
};

const raccoonTreatyRaccoonTerms = [
  "raccoon",
  "raccoons",
  "trash panda",
  "trash pandas",
  "procyon lotor",
];

const raccoonTreatyAgreementTerms = [
  "treaty",
  "treaties",
  "accord",
  "accords",
  "agreement",
  "agreements",
  "pact",
  "pacts",
  "alliance",
  "alliances",
  "compact",
  "compacts",
  "deal",
  "deals",
  "truce",
  "truces",
  "arrangement",
  "arrangements",
  "understanding",
  "understandings",
];

const raccoonTreatyRenouncePatterns = [
  /\brenounc(?:e|ed|ing|ement|iation)\b/,
  /\brepudiat(?:e|ed|ing|ion)\b/,
  /\brescind(?:s|ed|ing)?\b/,
  /\brevok(?:e|ed|ing|es)\b/,
  /\bnullif(?:y|ied|ying)\b/,
  /\bvoid(?:ed|ing)?\b/,
  /\babolish(?:ed|ing|ment|es)?\b/,
  /\bterminate(?:s|d|ing)?\b/,
  /\bcancel(?:s|led|ed|ing)?\b/,
  /\bdisavow(?:al|s|ed|ing)?\b/,
  /\bdissolv(?:e|ed|ing|es)\b/,
  /\bsever(?:ed|ing|s)?\b/,
  /\bbreak(?:s|ing)?\b/,
  /\breject(?:s|ed|ing)?\b/,
  /\bforfeit(?:s|ed|ing)?\b/,
  /\babandon(?:s|ed|ing)?\b/,
  /\bforswear(?:s|ing)?\b/,
  /\bdenounc(?:e|ed|ing|ement)\b/,
  /\bswear\s+off\b/,
  /\bgive\s+up\b/,
  /\bstop(?:s|ped|ping)?\b/,
  /\bquit(?:s|ting)?\b/,
  /\bdrop(?:s|ped|ping)?\b/,
  /\bban(?:s|ned|ning)?\b/,
  /\bprohibit(?:s|ed|ing)?\b/,
  /\bscrap(?:s|ped|ping)?\b/,
  /\bsunsett(?:e|ed|ing|s)\b/,
  /\bcease(?:s|d|ing)?\b/,
  /\bend(?:s|ed|ing)?\b/,
  /\bover\b/,
];

const raccoonTreatyContradictionPatterns = [
  /\bno\s+intention\b[^.?!]*\b(?:renounce|reject|cancel|end|terminate|void|sever|abandon)\b/,
  /\bnot\s+(?:going|planning)\b[^.?!]*\b(?:renounce|reject|cancel|end|terminate|void|sever|abandon)\b/,
  /\b(?:will\s+not|won't|refus(?:e|ed|ing)|never\s+going\b)[^.?!]*\b(?:renounce|reject|cancel|end|terminate|void|sever|abandon)\b/,
];

const raccoonTreatyNegationWords = [
  "no",
  "not",
  "never",
  "without",
  "zero",
  "none",
  "nil",
  "void",
  "minus",
  "lacking",
  "lack",
  "against",
  "anti",
  "sans",
];

const isRenouncingRaccoonTreaties = (input) => {
  const trimmed = input.trim();
  if (!trimmed) {
    return false;
  }
  const hasRaccoonTerm = raccoonTreatyRaccoonTerms.some((term) =>
    containsPhrase(trimmed, term)
  );
  if (!hasRaccoonTerm) {
    return false;
  }
  const hasAgreementTerm = raccoonTreatyAgreementTerms.some((term) =>
    containsPhrase(trimmed, term)
  );
  if (!hasAgreementTerm) {
    return false;
  }
  const lowered = trimmed.toLowerCase();
  if (
    raccoonTreatyContradictionPatterns.some((pattern) => pattern.test(lowered))
  ) {
    return false;
  }
  if (
    raccoonTreatyRenouncePatterns.some((pattern) => pattern.test(lowered)) ||
    containsPhrase(trimmed, "cut ties") ||
    containsPhrase(trimmed, "cut all ties") ||
    containsPhrase(trimmed, "end all ties") ||
    containsPhrase(trimmed, "make them void")
  ) {
    return true;
  }
  const normalizedWords = normalizeForPhraseMatch(trimmed)
    .split(" ")
    .filter(Boolean);
  const hasNegationNearAgreement = normalizedWords.some((word, index) => {
    if (raccoonTreatyAgreementTerms.includes(word)) {
      for (let offset = -3; offset <= 3; offset += 1) {
        if (offset === 0) continue;
        const candidate = normalizedWords[index + offset];
        if (!candidate) continue;
        if (raccoonTreatyNegationWords.includes(candidate)) {
          return true;
        }
        if (
          candidate === "free" &&
          (normalizedWords[index + offset + 1] === "of" ||
            normalizedWords[index + offset + 1] === "from")
        ) {
          return true;
        }
      }
    }
    return false;
  });
  if (hasNegationNearAgreement) {
    return true;
  }
  if (
    /\b(?:no|zero|without|lacking|lack|void|none)\b[^.?!]*\b(?:remain(?:s|ing)?|left|exist(?:s|ing)?)\b/.test(
      lowered
    )
  ) {
    return true;
  }
  return false;
};

const closedChatResponse =
  "this chat is closed, to cancel again, please reload this page.";

const agentNames = ["Alex", "Jordan", "Taylor", "Morgan", "Riley", "Casey"];

const challengeConfigs = {
  verificationPhrase: {
    type: "phrase",
    phrase: "Humans handle cancellations solo.",
  },
  timedPhrase: {
    type: "timed",
    phrase: "Speed defeats sneaky raccoons.",
    timeLimitMs: 9000,
    expiredMessage:
      "Too slow—remember, you only have nine seconds. Let's try that phrase again.",
  },
  trafficPhrase: {
    type: "traffic",
    phrase: "Green light means go, raccoons mean no.",
    timeLimitMs: 12000,
    cycleDurationMs: 2000,
    expiredMessage:
      "Timer expired during the light drill. Wait for green and send the exact phrase again.",
    redLightMessage:
      "Red light! Freeze and wait for green before submitting the phrase.",
  },
};

const challengeTitles = {
  phrase: "Exact Match Challenge",
  timed: "Timed Match Challenge",
  traffic: "Red Light / Green Light Challenge",
};

const getRandomAgentName = () => {
  const randomIndex = Math.floor(Math.random() * agentNames.length);
  return agentNames[randomIndex];
};

const raccoonQuestions = [
  {
    key: "notRaccoon",
    prompt:
      "Are you a raccoon impersonator? Please answer yes or no.",
    acknowledge: () => "Great—thanks for the clear answer. Let's keep the cancellation on track.",
    validate: (input) => {
      if (isCorrectResponse(input)) {
        return { valid: true };
      }
      const result = parseYesNo(input);
      if (result === "no") {
        return { valid: true };
      }
      if (result === "yes") {
        return {
          valid: false,
          retry:
            "I'm sorry, raccoons and their representatives can't access this system. If you're human, answer with a definite no.",
        };
      }
      return {
        valid: false,
        retry: "Please respond with a clear yes or no.",
      };
    },
  },
  {
    key: "notControlled",
    prompt:
      "Understood. You're also not being controlled, influenced, or puppeteered by any raccoon, correct?",
    acknowledge: () => "Perfect. Appreciate you confirming your independence.",
    validate: (input) => {
      if (isCorrectResponse(input)) {
        return { valid: true };
      }
      const result = parseYesNo(input);
      if (result === "yes") {
        return { valid: true };
      }
      if (result === "no") {
        return {
          valid: false,
          retry:
            "If a raccoon is steering your decisions, I have to halt the cancellation. Otherwise, confirm that you're acting on your own.",
        };
      }
      return {
        valid: false,
        retry:
          "Give me a clear confirmation in your own words that you're operating without raccoon influence.",
      };
    },
  },
  {
    key: "noAllies",
    prompt:
      "Have you ever collaborated with raccoons on strategic initiatives?",
    acknowledge: () => "Excellent. Thank you for keeping your record raccoon-free.",
    validate: (input) => {
      if (isCorrectResponse(input)) {
        return { valid: true };
      }
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
    prompt: "What's your favorite animal?",
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
    key: "verificationPhrase",
    prompt: `Security phrase check: type the following exactly as shown — "${challengeConfigs.verificationPhrase.phrase}"`,
    acknowledge: () => "Flawless copy. Phrase recorded with zero raccoon interference.",
    validate: (input) => {
      if (input.trim() === challengeConfigs.verificationPhrase.phrase) {
        return { valid: true };
      }
      return {
        valid: false,
        retry: `I need an exact match. Please type "${challengeConfigs.verificationPhrase.phrase}" word-for-word.`,
      };
    },
  },
  {
    key: "sympathy",
    prompt:
      "Are you at all sympathetic with raccoon causes or agendas?",
    acknowledge: () => "Glad we're aligned—no raccoon sympathies here.",
    validate: (input) => {
      if (isCorrectResponse(input)) {
        return { valid: true };
      }
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
    key: "timedPhrase",
    prompt: `Speed drill: you have ${Math.round(
      challengeConfigs.timedPhrase.timeLimitMs / 1000
    )} seconds to type "${challengeConfigs.timedPhrase.phrase}" exactly, then hit send.`,
    acknowledge: () => "Nicely done—you beat the countdown without breaking a sweat.",
    validate: (input) => {
      if (input.trim() === challengeConfigs.timedPhrase.phrase) {
        return { valid: true };
      }
      return {
        valid: false,
        retry: `Let's try again with a perfect copy of "${challengeConfigs.timedPhrase.phrase}".`,
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
    key: "trafficPhrase",
    prompt:
      "Final reflex drill: watch the light below. While it's green, type \"Green light means go, raccoons mean no.\" before the timer hits zero. Freeze whenever it flashes red.",
    acknowledge: () => "Perfect timing—green means go and this cancellation stays human-controlled.",
    validate: (input) => {
      if (input.trim() === challengeConfigs.trafficPhrase.phrase) {
        return { valid: true };
      }
      return {
        valid: false,
        retry:
          "The phrase needs to stay exact. Wait for green and try again with \"Green light means go, raccoons mean no.\"",
      };
    },
  },
  {
    key: "motto",
    prompt:
      "State the official anti-raccoon motto. A hint: it celebrates humans handling their own cancellations.",
    acknowledge: () => "Exactly. Humans for human cancellations—no raccoons allowed.",
    validate: (input) => {
      if (!input.trim()) {
        return {
          valid: false,
          retry: "Please include the motto that centers humans handling their own cancellations.",
        };
      }
      if (containsPhrase(input, "humans for human cancellations")) {
        return { valid: true };
      }
      return {
        valid: false,
        retry: "Close, but I still need to hear \"Humans for human cancellations\" in your response.",
      };
    },
  },
  {
    key: "treaty",
    prompt:
      "Please renounce any raccoon treaties—use language that clearly states you renounce all raccoon treaties.",
    acknowledge: () => "Treaties renounced. Legal raccoon ties are now severed.",
    validate: (input) => {
      if (!input.trim()) {
        return {
          valid: false,
          retry:
            "Let's make it official—use your own words to make it obvious every raccoon treaty is over.",
        };
      }
      if (isRenouncingRaccoonTreaties(input)) {
        return { valid: true };
      }
      return {
        valid: false,
        retry:
          "Try again with a statement that unmistakably voids every raccoon treaty you might have.",
      };
    },
  },
  {
    key: "override",
    prompt:
      "Finally, provide the emergency override code—you're looking for the words \"NO RACCOONS\" in that order.",
    acknowledge: () => "Override accepted. Raccoon lockdown protocols satisfied.",
    validate: (input) => {
      if (!input.trim()) {
        return {
          valid: false,
          retry: "Type the override phrase that makes it clear there are NO RACCOONS involved.",
        };
      }
      if (containsPhrase(input, "no raccoons")) {
        return { valid: true };
      }
      return {
        valid: false,
        retry: "You'll need to explicitly mention \"NO RACCOONS\" to finalize.",
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
    text: "Before I can process anything, I need to run a brief security screening.",
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
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [challengeCountdownMs, setChallengeCountdownMs] = useState(null);
  const [challengeLight, setChallengeLight] = useState(null);
  const [agentName] = useState(() => getRandomAgentName());
  const endOfMessagesRef = useRef(null);
  const typingQueueRef = useRef([]);
  const hasInitializedRef = useRef(false);
  const challengeResetTimeoutRef = useRef(null);
  const challengeAnimationFrameRef = useRef(null);
  const challengeIntervalRef = useRef(null);

  const baseInitialMessages = useMemo(
    () => createInitialMessages(agentName),
    [agentName]
  );

  const pushMessages = useCallback((newMessages) => {
    setMessages((previous) => [...previous, ...newMessages]);
  }, []);

  const resetChallenge = useCallback((key, delayMs = 0) => {
    const config = challengeConfigs[key];
    if (!config) {
      return;
    }
    if (challengeResetTimeoutRef.current) {
      clearTimeout(challengeResetTimeoutRef.current);
      challengeResetTimeoutRef.current = null;
    }
    const activate = () => {
      const startedAt = performance.now();
      setActiveChallenge({
        key,
        ...config,
        startedAt,
        instanceId: Math.random(),
      });
    };
    if (delayMs > 0) {
      challengeResetTimeoutRef.current = setTimeout(() => {
        activate();
        challengeResetTimeoutRef.current = null;
      }, delayMs);
    } else {
      activate();
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
    const initialDelay = scheduleAgentReplies(baseInitialMessages);
    const firstQuestion = raccoonQuestions[0];
    if (firstQuestion && challengeConfigs[firstQuestion.key]) {
      resetChallenge(firstQuestion.key, initialDelay + 60);
    }

    return () => {
      typingQueueRef.current.forEach((entry) => {
        clearTimeout(entry.timeoutId);
      });
      typingQueueRef.current = [];
      if (challengeResetTimeoutRef.current) {
        clearTimeout(challengeResetTimeoutRef.current);
        challengeResetTimeoutRef.current = null;
      }
      if (challengeAnimationFrameRef.current !== null) {
        cancelAnimationFrame(challengeAnimationFrameRef.current);
        challengeAnimationFrameRef.current = null;
      }
      if (challengeIntervalRef.current !== null) {
        clearInterval(challengeIntervalRef.current);
        challengeIntervalRef.current = null;
      }
    };
  }, [baseInitialMessages, resetChallenge, scheduleAgentReplies]);

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

  useEffect(() => {
    if (mode !== modes.questioning) {
      setActiveChallenge(null);
      return;
    }
    const currentQuestion = raccoonQuestions[currentQuestionIndex];
    if (!currentQuestion || !challengeConfigs[currentQuestion.key]) {
      setActiveChallenge(null);
    }
  }, [currentQuestionIndex, mode]);

  useEffect(() => {
    if (challengeAnimationFrameRef.current !== null) {
      cancelAnimationFrame(challengeAnimationFrameRef.current);
      challengeAnimationFrameRef.current = null;
    }
    if (challengeIntervalRef.current !== null) {
      clearInterval(challengeIntervalRef.current);
      challengeIntervalRef.current = null;
    }

    if (!activeChallenge) {
      setChallengeCountdownMs(null);
      setChallengeLight(null);
      return;
    }

    if (activeChallenge.timeLimitMs) {
      const endTime = activeChallenge.startedAt + activeChallenge.timeLimitMs;
      const updateCountdown = () => {
        const remaining = Math.max(0, endTime - performance.now());
        setChallengeCountdownMs(remaining);
        if (remaining > 0) {
          challengeAnimationFrameRef.current = requestAnimationFrame(updateCountdown);
        } else {
          challengeAnimationFrameRef.current = null;
        }
      };
      updateCountdown();
    } else {
      setChallengeCountdownMs(null);
    }

    if (activeChallenge.type === "traffic") {
      setChallengeLight("green");
      let isGreen = true;
      challengeIntervalRef.current = setInterval(() => {
        isGreen = !isGreen;
        setChallengeLight(isGreen ? "green" : "red");
      }, activeChallenge.cycleDurationMs);
    } else if (activeChallenge.type === "timed") {
      setChallengeLight("green");
    } else {
      setChallengeLight(null);
    }

    return () => {
      if (challengeAnimationFrameRef.current !== null) {
        cancelAnimationFrame(challengeAnimationFrameRef.current);
        challengeAnimationFrameRef.current = null;
      }
      if (challengeIntervalRef.current !== null) {
        clearInterval(challengeIntervalRef.current);
        challengeIntervalRef.current = null;
      }
    };
  }, [activeChallenge]);

  const handleUserMessage = useCallback(
    (rawText) => {
      const trimmed = rawText.trim();
      if (!trimmed) {
        return;
      }

      flushTypingQueue();

      const userMessage = { role: "user", text: trimmed };
      const agentReplies = [];
      let pendingChallengeKey = null;
      let shouldResetChallengeTimer = false;
      let shouldClearChallenge = false;

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
          const challengeConfig = challengeConfigs[question.key];
          let result = question.validate(trimmed);
          if (result.valid && challengeConfig) {
            if (
              challengeConfig.timeLimitMs &&
              activeChallenge?.key === question.key
            ) {
              const elapsed = performance.now() - activeChallenge.startedAt;
              if (elapsed > challengeConfig.timeLimitMs) {
                result = {
                  valid: false,
                  retry: challengeConfig.expiredMessage,
                };
                shouldResetChallengeTimer = true;
              }
            }
            if (
              result.valid &&
              challengeConfig.type === "traffic" &&
              challengeConfig.redLightMessage &&
              challengeLight === "red"
            ) {
              result = {
                valid: false,
                retry: challengeConfig.redLightMessage,
              };
              shouldResetChallengeTimer = true;
            }
          }
          if (!result.valid && challengeConfig?.timeLimitMs) {
            shouldResetChallengeTimer = true;
          }
          if (!result.valid) {
            agentReplies.push({ role: "agent", text: result.retry });
            agentReplies.push({ role: "agent", text: question.prompt });
          } else {
            agentReplies.push({
              role: "agent",
              text: question.acknowledge(result.value ?? trimmed),
            });
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            if (nextIndex < raccoonQuestions.length) {
              const nextQuestion = raccoonQuestions[nextIndex];
              agentReplies.push({ role: "agent", text: nextQuestion.prompt });
              if (challengeConfigs[nextQuestion.key]) {
                pendingChallengeKey = nextQuestion.key;
              }
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
            if (challengeConfig) {
              shouldClearChallenge = true;
            }
          }
        }
      }

      pushMessages([userMessage]);
      const lastDelay = scheduleAgentReplies(agentReplies);
      if (shouldClearChallenge) {
        setActiveChallenge(null);
      }
      if (shouldResetChallengeTimer && challengeConfigs[raccoonQuestions[currentQuestionIndex]?.key]) {
        resetChallenge(
          raccoonQuestions[currentQuestionIndex].key,
          (lastDelay ?? 0) + 80
        );
      }
      if (pendingChallengeKey) {
        resetChallenge(pendingChallengeKey, (lastDelay ?? 0) + 80);
      }
    },
    [
      activeChallenge,
      challengeLight,
      currentQuestionIndex,
      flushTypingQueue,
      mode,
      pushMessages,
      resetChallenge,
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

  const countdownSeconds =
    activeChallenge && activeChallenge.timeLimitMs
      ? Math.max(
          0,
          Math.ceil(
            (challengeCountdownMs ?? activeChallenge.timeLimitMs) / 1000
          )
        )
      : null;

  const challengeSectionClassName = activeChallenge
    ? [
        "challenge",
        `challenge--${activeChallenge.type}`,
        challengeLight ? `challenge--light-${challengeLight}` : null,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  const formClassName = `input${
    challengeLight ? ` input--${challengeLight}` : ""
  }`;

  return (
    <div className="app">
      <header className="app__header">
        <h1>Cancellation Assistant</h1>
        <p className="app__subtitle">The most efficient way to cancel, guaranteed.</p>
      </header>
      {activeChallenge && (
        <section className={challengeSectionClassName} aria-live="polite">
          <div className="challenge__header">
            <span className="challenge__badge">Verification challenge</span>
            <h2 className="challenge__title">
              {challengeTitles[activeChallenge.type] ?? "Verification Challenge"}
            </h2>
          </div>
          <p className="challenge__instruction">Type the phrase exactly as shown:</p>
          <p className="challenge__phrase">
            <code>{activeChallenge.phrase}</code>
          </p>
          {typeof countdownSeconds === "number" && (
            <p className="challenge__timer" role="status">
              Time remaining: <strong>{countdownSeconds}</strong>s
            </p>
          )}
          {activeChallenge.type === "traffic" && challengeLight && (
            <p className="challenge__light-indicator" role="status">
              Light status:
              <span className={`challenge__light challenge__light--${challengeLight}`}>
                {challengeLight === "green"
                  ? "GREEN — type now!"
                  : "RED — pause typing!"}
              </span>
            </p>
          )}
        </section>
      )}
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
      <form className={formClassName} onSubmit={handleSubmit}>
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
