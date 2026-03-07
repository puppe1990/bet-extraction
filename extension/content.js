function cleanText(value) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function textFromSelectors(selectors, scope = document) {
  for (const selector of selectors) {
    const element = scope.querySelector(selector);
    const value = cleanText(element?.textContent || "");
    if (value) {
      return value;
    }
  }

  return "";
}

function valueFromSelectors(selectors, scope = document) {
  for (const selector of selectors) {
    const element = scope.querySelector(selector);
    if (!element) {
      continue;
    }

    if ("value" in element && typeof element.value === "string") {
      const value = cleanText(element.value);
      if (value) {
        return value;
      }
    }

    const fallback = cleanText(element.getAttribute("value") || "");
    if (fallback) {
      return fallback;
    }
  }

  return "";
}

function parseDecimal(value) {
  if (!value) {
    return undefined;
  }

  const normalized = value
    .replace(",", ".")
    .replace(/[^\d.]/g, "")
    .trim();

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function detectBookmaker(url) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  return host.split(".")[0] || host;
}

function detectSportFromUrl(url) {
  const lower = url.toLowerCase();
  if (lower.includes("soccer") || lower.includes("football")) {
    return "Football";
  }
  if (lower.includes("tennis")) {
    return "Tennis";
  }
  if (lower.includes("basketball") || lower.includes("nba")) {
    return "Basketball";
  }
  if (lower.includes("baseball")) {
    return "Baseball";
  }
  return "Sports";
}

function selectedTextFallback() {
  return cleanText(window.getSelection?.()?.toString() || "");
}

function genericDraft(url) {
  const selection = selectedTextFallback();
  const eventName =
    textFromSelectors(["h1", "[data-testid='event-name']", "title"]) ||
    document.title;
  const market = textFromSelectors([
    "[data-testid='market-name']",
    ".market-name",
    "h2",
  ]);
  const bookmaker = detectBookmaker(url);

  return {
    bookmaker,
    eventName: eventName || document.title || "Untitled event",
    market: market || "Manual capture",
    selection: selection || "Review selection",
    sport: detectSportFromUrl(url),
    oddsDecimal: undefined,
    stakeAmount: undefined,
    placedAt: new Date().toISOString(),
    rawSourceUrl: url,
    parserConfidence: selection ? "medium" : "low",
    note: `Captured with generic parser on ${bookmaker}`,
    tags: [bookmaker],
  };
}

function findBet365SlipRoot() {
  const selectors = [
    "[class*='bs-Betslip']",
    "[class*='betslip']",
    "[class*='BetSlip']",
    "[data-testid*='betslip']",
  ];

  for (const selector of selectors) {
    const root = document.querySelector(selector);
    if (root) {
      return root;
    }
  }

  return document.body;
}

function findBet365Selection(root) {
  const selectors = [
    "[class*='Selection']",
    "[class*='selection']",
    "[class*='Outcome']",
    "[data-testid*='selection']",
  ];

  for (const selector of selectors) {
    const nodes = Array.from(root.querySelectorAll(selector));
    const match = nodes
      .map((node) => cleanText(node.textContent || ""))
      .find((value) => value && value.length <= 90);

    if (match) {
      return match;
    }
  }

  return "";
}

function parseBet365Draft(url) {
  const root = findBet365SlipRoot();
  const bookmaker = "bet365";

  const eventName = textFromSelectors(
    [
      "[class*='EventInfo']",
      "[class*='Fixture']",
      "[class*='Participant']",
      "[data-testid*='fixture']",
    ],
    root,
  );

  const market = textFromSelectors(
    [
      "[class*='Market']",
      "[class*='market']",
      "[data-testid*='market']",
    ],
    root,
  );

  const selection = findBet365Selection(root) || selectedTextFallback();

  const oddsText = textFromSelectors(
    [
      "[class*='Odds']",
      "[class*='odds']",
      "[data-testid*='odds']",
    ],
    root,
  );

  const stakeText = valueFromSelectors(
    [
      "input[type='number']",
      "input[inputmode='decimal']",
      "[class*='Stake'] input",
      "[class*='stake'] input",
    ],
    root,
  );

  const confidenceParts = [eventName, market, selection].filter(Boolean).length;
  const parserConfidence =
    confidenceParts >= 3 ? "high" : confidenceParts === 2 ? "medium" : "low";

  if (!eventName && !market && !selection) {
    return null;
  }

  return {
    bookmaker,
    eventName: eventName || document.title || "Bet365 event",
    market: market || "Bet365 market",
    selection: selection || "Review selection",
    sport: detectSportFromUrl(url),
    oddsDecimal: parseDecimal(oddsText),
    stakeAmount: parseDecimal(stakeText),
    placedAt: new Date().toISOString(),
    rawSourceUrl: url,
    parserConfidence,
    note: `Captured from Bet365 ${parserConfidence} confidence parser`,
    tags: ["bet365", parserConfidence],
  };
}

const parsers = [
  {
    bookmakerKey: "bet365",
    canRun(url) {
      return /bet365/i.test(url);
    },
    extractDraft(url) {
      return parseBet365Draft(url);
    },
  },
];

function buildDraft() {
  const url = window.location.href;
  for (const parser of parsers) {
    if (!parser.canRun(url)) {
      continue;
    }

    const draft = parser.extractDraft(url);
    if (draft) {
      return draft;
    }
  }

  return genericDraft(url);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "LEDGER_CAPTURE_DRAFT") {
    sendResponse({ draft: buildDraft() });
  }
});
