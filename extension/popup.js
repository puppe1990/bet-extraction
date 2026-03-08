const $ = (id) => document.getElementById(id);
const DEFAULT_APP_URL = "https://bankrollkit.netlify.app";
const LEGACY_LOCAL_APP_URLS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
]);

const connectPanel = $("connect-panel");
const devicePanel = $("device-panel");
const homePanel = $("home-panel");
const bankrollPanel = $("bankroll-panel");
const capturePanel = $("capture-panel");
const messagePanel = $("message-panel");
const messageBody = $("message-body");
const draftStatusPanel = $("draft-status");
const draftStatusBadge = $("draft-status-badge");
const draftStatusMessage = $("draft-status-message");

const appUrlInput = $("app-url");
const emailInput = $("email");
const passwordInput = $("password");
const deviceNameInput = $("device-name");
const openAppLink = $("open-app-link");
const authButton = $("auth-button");
const upgradeExtensionLink = $("upgrade-extension-link");

const homeBalance = $("home-balance");
const homePlan = $("home-plan");
const homeUsage = $("home-usage");
const recentBetsList = $("recent-bets");
const recentTransactionsList = $("recent-transactions");
const bankrollTypeInput = $("bankroll-type");
const bankrollAmountInput = $("bankroll-amount");
const bankrollNoteInput = $("bankroll-note");

const fields = {
  bookmaker: $("draft-bookmaker"),
  sport: $("draft-sport"),
  eventName: $("draft-event"),
  market: $("draft-market"),
  selection: $("draft-selection"),
  oddsDecimal: $("draft-odds"),
  stakeAmount: $("draft-stake"),
  note: $("draft-note"),
};

let currentState = null;

function normalizeAppUrl(value) {
  const normalized = typeof value === "string" ? value.trim().replace(/\/$/, "") : "";

  if (!normalized || LEGACY_LOCAL_APP_URLS.has(normalized)) {
    return DEFAULT_APP_URL;
  }

  return normalized;
}

function formatMoney(value) {
  const amount = typeof value === "number" ? value : 0;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(amount);
}

function showMessage(text, tone = "success") {
  messagePanel.classList.remove("hidden");
  messagePanel.style.borderColor =
    tone === "error" ? "rgba(255, 107, 107, 0.28)" : "rgba(61, 214, 140, 0.26)";
  messagePanel.style.background =
    tone === "error" ? "rgba(255, 107, 107, 0.12)" : "rgba(61, 214, 140, 0.09)";
  messageBody.textContent = text;
}

function clearMessage() {
  messagePanel.classList.add("hidden");
  messageBody.textContent = "";
}

function mapDraftFromForm() {
  return {
    bookmaker: fields.bookmaker.value.trim(),
    sport: fields.sport.value.trim() || "Sports",
    eventName: fields.eventName.value.trim(),
    market: fields.market.value.trim(),
    selection: fields.selection.value.trim(),
    oddsDecimal: fields.oddsDecimal.value ? Number(fields.oddsDecimal.value) : undefined,
    stakeAmount: fields.stakeAmount.value ? Number(fields.stakeAmount.value) : undefined,
    note: fields.note.value.trim() || undefined,
    placedAt: new Date().toISOString(),
  };
}

function fillDraft(draft) {
  fields.bookmaker.value = draft.bookmaker || "";
  fields.sport.value = draft.sport || "";
  fields.eventName.value = draft.eventName || "";
  fields.market.value = draft.market || "";
  fields.selection.value = draft.selection || "";
  fields.oddsDecimal.value = draft.oddsDecimal || "";
  fields.stakeAmount.value = draft.stakeAmount || "";
  fields.note.value = draft.note || "";
}

function draftSummary(draft) {
  const confidence = draft.parserConfidence ? ` (${draft.parserConfidence} confidence)` : "";
  const bookmaker = draft.bookmaker ? ` from ${draft.bookmaker}` : "";
  return `Draft captured${bookmaker}${confidence}.`;
}

function getDraftValidation(draft) {
  const missing = [];
  if (!draft.bookmaker) missing.push("bookmaker");
  if (!draft.eventName) missing.push("event");
  if (!draft.market) missing.push("market");
  if (!draft.selection) missing.push("selection");

  const confidence = draft?.parserConfidence || "manual";
  const hasCoreFields = missing.length === 0;
  const level = hasCoreFields ? (confidence === "low" ? "warn" : "good") : "bad";

  return {
    missing,
    level,
    confidence,
    hasCoreFields,
  };
}

function renderDraftStatus(draft) {
  const hasDraft =
    draft &&
    (draft.bookmaker || draft.eventName || draft.market || draft.selection || draft.note);

  draftStatusPanel.classList.remove("draft-status--good", "draft-status--warn", "draft-status--bad");

  if (!hasDraft) {
    draftStatusBadge.textContent = "Empty";
    draftStatusMessage.textContent = "Capture a bookmaker page or fill the form manually.";
    return;
  }

  const validation = getDraftValidation(draft);
  draftStatusPanel.classList.add(`draft-status--${validation.level}`);

  if (!validation.hasCoreFields) {
    draftStatusBadge.textContent = "Needs review";
    draftStatusMessage.textContent = `Missing required fields: ${validation.missing.join(", ")}.`;
    return;
  }

  if (validation.confidence === "low") {
    draftStatusBadge.textContent = "Low confidence";
    draftStatusMessage.textContent =
      "The core fields are filled, but this capture still needs a manual review before saving.";
    return;
  }

  draftStatusBadge.textContent = "Ready";
  draftStatusMessage.textContent =
    validation.confidence === "manual"
      ? "Manual draft looks complete enough to preview or save."
      : `Draft looks solid with ${validation.confidence} parser confidence.`;
}

function getIsExtensionPremium(home) {
  return Boolean(home && home.planKey && home.planKey !== "free");
}

function syncCaptureAvailability(state) {
  const isPremium = getIsExtensionPremium(state?.home);
  $("preview-button").disabled = !isPremium;
  $("save-button").disabled = !isPremium;
  upgradeExtensionLink.classList.toggle("hidden", isPremium);
  upgradeExtensionLink.href = `${normalizeAppUrl(state?.appUrl || appUrlInput.value)}/settings?upgradeSource=extension_capture_lock#extension`;
}

function renderHome(home) {
  const hasHome = Boolean(home);
  homePanel.classList.toggle("hidden", !hasHome);
  if (!hasHome) {
    recentBetsList.innerHTML = "";
    recentTransactionsList.innerHTML = "";
    homeUsage.textContent = "";
    return;
  }

  homeBalance.textContent = formatMoney(home.balance);
  homePlan.textContent = String(home.planKey || "free").replaceAll("_", " ").toUpperCase();

  if (typeof home.monthlyBetsRemaining === "number") {
    homeUsage.textContent =
      home.planKey === "free"
        ? `${home.monthlyBetsRemaining} monthly bets remaining on Free.`
        : `Billing status: ${home.billingStatus}.`;
  } else {
    homeUsage.textContent = `Billing status: ${home.billingStatus}.`;
  }

  recentBetsList.innerHTML = "";
  const recent = Array.isArray(home.recentBets) ? home.recentBets : [];
  if (!recent.length) {
    const item = document.createElement("li");
    item.innerHTML = `<span>No bets logged yet.</span>`;
    recentBetsList.appendChild(item);
    return;
  }

  for (const bet of recent) {
    const item = document.createElement("li");
    const profit = typeof bet.profitAmount === "number" ? bet.profitAmount : null;
    const profitClass = profit == null ? "" : profit >= 0 ? "positive" : "negative";
    const actionButtons =
      bet.status === "open"
        ? `
          <div class="bet-actions">
            <button class="bet-action" data-action="settle" data-bet-id="${bet.id}" data-status="win">Win</button>
            <button class="bet-action" data-action="settle" data-bet-id="${bet.id}" data-status="loss">Loss</button>
            <button class="bet-action" data-action="settle" data-bet-id="${bet.id}" data-status="void">Void</button>
            <button class="bet-action" data-action="settle" data-bet-id="${bet.id}" data-status="half_win">Half win</button>
            <button class="bet-action" data-action="settle" data-bet-id="${bet.id}" data-status="half_loss">Half loss</button>
            <button class="bet-action" data-action="settle" data-bet-id="${bet.id}" data-status="cashout">Cashout</button>
          </div>
        `
        : "";
    item.innerHTML = `
      <div class="bet-row">
        <div>
          <strong>${bet.eventName}</strong>
          <span>${bet.bookmaker} · ${bet.status}</span>
        </div>
        <div class="bet-profit ${profitClass}">
          ${profit == null ? formatMoney(bet.stakeAmount) : formatMoney(profit)}
        </div>
      </div>
      ${actionButtons}
    `;
    recentBetsList.appendChild(item);
  }

  recentTransactionsList.innerHTML = "";
  const transactions = Array.isArray(home.recentTransactions) ? home.recentTransactions : [];
  if (!transactions.length) {
    const item = document.createElement("li");
    item.innerHTML = `<span>No transactions yet.</span>`;
    recentTransactionsList.appendChild(item);
    return;
  }

  for (const transaction of transactions) {
    const item = document.createElement("li");
    const amountClass =
      typeof transaction.amount === "number"
        ? transaction.amount >= 0
          ? "positive"
          : "negative"
        : "";
    item.innerHTML = `
      <div class="txn-row">
        <div>
          <strong>${transaction.type}</strong>
          <span>${transaction.note || transaction.eventName || "No note"}</span>
        </div>
        <div class="bet-profit ${amountClass}">
          ${formatMoney(transaction.amount)}
        </div>
      </div>
    `;
    recentTransactionsList.appendChild(item);
  }
}

function setConnectedState(state) {
  currentState = state;
  const connected = Boolean(state.accessToken);
  connectPanel.classList.toggle("hidden", connected);
  devicePanel.classList.toggle("hidden", !connected);
  capturePanel.classList.toggle("hidden", !connected);
  homePanel.classList.toggle("hidden", !connected);
  bankrollPanel.classList.toggle("hidden", !connected);

  if (state.user) {
    $("user-email").textContent = state.user.email;
  }

  if (state.device) {
    $("device-name-readonly").textContent = state.device.name || "BankrollKit device";
  }

  if (state.appUrl) {
    appUrlInput.value = normalizeAppUrl(state.appUrl);
    openAppLink.href = `${normalizeAppUrl(state.appUrl)}/login`;
  }

  renderHome(state.home);

  if (state.draft) {
    fillDraft(state.draft);
  }

  renderDraftStatus(state.draft || mapDraftFromForm());
  syncCaptureAvailability(state);
}

async function sendMessage(type, payload) {
  const response = await chrome.runtime.sendMessage({ type, payload });
  if (!response?.ok) {
    throw new Error(response?.error || "Extension request failed.");
  }
  return response.result;
}

async function boot() {
  try {
    const state = await sendMessage("LEDGER_GET_STATE");
    setConnectedState(state);
    if (state.accessToken) {
      const refreshed = await sendMessage("LEDGER_REFRESH_ME");
      setConnectedState({
        ...state,
        user: refreshed.user,
        device: refreshed.device,
        home: refreshed.home,
      });
    }
  } catch (error) {
    showMessage(error.message, "error");
  }
}

appUrlInput.addEventListener("input", () => {
  const appUrl = normalizeAppUrl(appUrlInput.value);
  openAppLink.href = `${appUrl}/login`;
});

authButton.addEventListener("click", async () => {
  clearMessage();
  try {
    const appUrl = normalizeAppUrl(appUrlInput.value);
    appUrlInput.value = appUrl;
    if (!emailInput.value.trim()) {
      throw new Error("Enter your BankrollKit email.");
    }
    if (!passwordInput.value) {
      throw new Error("Enter your BankrollKit password.");
    }
    const payload = {
      appUrl,
      email: emailInput.value.trim(),
      password: passwordInput.value,
      name: deviceNameInput.value.trim() || "BankrollKit Chrome Extension",
    };

    const result = await sendMessage("LEDGER_LOGIN", payload);
    passwordInput.value = "";

    const refreshed = await sendMessage("LEDGER_REFRESH_ME");
    setConnectedState({
      accessToken: result.accessToken,
      appUrl,
      user: refreshed.user,
      device: refreshed.device,
      home: refreshed.home,
      draft: null,
    });
    showMessage("Signed in. You can now capture and save bets.");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

$("refresh-button").addEventListener("click", async () => {
  clearMessage();
  try {
    const result = await sendMessage("LEDGER_REFRESH_ME");
    setConnectedState({
      accessToken: true,
      appUrl: appUrlInput.value.trim(),
      user: result.user,
      device: result.device,
      home: result.home,
    });
    showMessage("Session refreshed.");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

$("bankroll-save-button").addEventListener("click", async () => {
  clearMessage();
  try {
    await sendMessage("LEDGER_ADD_BANKROLL_TRANSACTION", {
      type: bankrollTypeInput.value,
      amount: Number(bankrollAmountInput.value),
      note: bankrollNoteInput.value.trim() || undefined,
    });
    bankrollAmountInput.value = "";
    bankrollNoteInput.value = "";

    const refreshed = await sendMessage("LEDGER_REFRESH_ME");
    setConnectedState({
      accessToken: true,
      appUrl: appUrlInput.value.trim(),
      user: refreshed.user,
      device: refreshed.device,
      home: refreshed.home,
    });
    showMessage("Bankroll updated.");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

recentBetsList.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.dataset.action !== "settle") return;

  clearMessage();
  try {
    const payload = {
      betId: target.dataset.betId,
      status: target.dataset.status,
    };

    if (target.dataset.status === "cashout") {
      const value = window.prompt("Cashout return amount in BRL");
      if (value == null) return;
      const customReturnAmount = Number(value.replace(",", "."));
      if (!Number.isFinite(customReturnAmount) || customReturnAmount < 0) {
        throw new Error("Enter a valid cashout return.");
      }
      payload.customReturnAmount = customReturnAmount;
    }

    await sendMessage("LEDGER_SETTLE_BET", payload);

    const refreshed = await sendMessage("LEDGER_REFRESH_ME");
    setConnectedState({
      accessToken: true,
      appUrl: appUrlInput.value.trim(),
      user: refreshed.user,
      device: refreshed.device,
      home: refreshed.home,
    });
    showMessage("Bet settled.");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

$("disconnect-button").addEventListener("click", async () => {
  await sendMessage("LEDGER_DISCONNECT");
  window.location.reload();
});

$("capture-button").addEventListener("click", async () => {
  clearMessage();
  try {
    const draft = await sendMessage("LEDGER_CAPTURE_ACTIVE_TAB");
    fillDraft(draft);
    renderDraftStatus(draft);
    showMessage(draftSummary(draft));
  } catch (error) {
    showMessage(error.message, "error");
  }
});

$("preview-button").addEventListener("click", async () => {
  clearMessage();
  try {
    if (!getIsExtensionPremium(currentState?.home)) {
      throw new Error("Upgrade to Pro in BankrollKit to preview and save extension drafts.");
    }

    const formDraft = mapDraftFromForm();
    const validation = getDraftValidation(formDraft);
    if (!validation.hasCoreFields) {
      throw new Error(`Fill the required fields first: ${validation.missing.join(", ")}.`);
    }

    const draft = await sendMessage("LEDGER_PREVIEW_DRAFT", formDraft);
    fillDraft(draft);
    renderDraftStatus(draft);
    showMessage("Draft normalized by BankrollKit. Review and save when ready.");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

$("save-button").addEventListener("click", async () => {
  clearMessage();
  try {
    if (!getIsExtensionPremium(currentState?.home)) {
      throw new Error("Upgrade to Pro in BankrollKit to preview and save extension drafts.");
    }

    const formDraft = mapDraftFromForm();
    const validation = getDraftValidation(formDraft);
    if (!validation.hasCoreFields) {
      throw new Error(`Fill the required fields first: ${validation.missing.join(", ")}.`);
    }

    const result = await sendMessage("LEDGER_SAVE_DRAFT", formDraft);
    showMessage(`Saved to BankrollKit: ${result.bet.eventName}`);
    fillDraft({
      bookmaker: "",
      sport: "",
      eventName: "",
      market: "",
      selection: "",
      oddsDecimal: "",
      stakeAmount: "",
      note: "",
    });
    renderDraftStatus(mapDraftFromForm());
    const refreshed = await sendMessage("LEDGER_REFRESH_ME");
    setConnectedState({
      accessToken: true,
      appUrl: appUrlInput.value.trim(),
      user: refreshed.user,
      device: refreshed.device,
      home: refreshed.home,
    });
  } catch (error) {
    showMessage(error.message, "error");
  }
});

Object.values(fields).forEach((field) => {
  field.addEventListener("input", () => {
    renderDraftStatus(mapDraftFromForm());
  });
});

boot();
