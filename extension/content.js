function textFromSelectors(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    const value = element?.textContent?.trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function detectBookmaker(url) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  return host.split(".")[0] || host;
}

function buildDraft() {
  const selection = window.getSelection?.()?.toString().trim() || "";
  const eventName =
    textFromSelectors(["h1", "[data-testid='event-name']", "title"]) ||
    document.title;

  const market = textFromSelectors([
    "[data-testid='market-name']",
    ".market-name",
    "h2",
  ]);

  return {
    bookmaker: detectBookmaker(window.location.href),
    eventName: eventName || document.title || "Untitled event",
    market: market || "Manual capture",
    selection: selection || "Review selection",
    sport: "Sports",
    oddsDecimal: undefined,
    stakeAmount: undefined,
    placedAt: new Date().toISOString(),
    rawSourceUrl: window.location.href,
    parserConfidence: selection ? "medium" : "low",
    note: "Captured from Chrome extension scaffold",
    tags: [],
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "LEDGER_CAPTURE_DRAFT") {
    sendResponse({ draft: buildDraft() });
  }
});
