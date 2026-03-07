const $ = (id) => document.getElementById(id);

const connectPanel = $("connect-panel");
const devicePanel = $("device-panel");
const capturePanel = $("capture-panel");
const messagePanel = $("message-panel");
const messageBody = $("message-body");

const appUrlInput = $("app-url");
const tokenInput = $("connection-token");
const deviceNameInput = $("device-name");

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

function setConnectedState(state) {
  const connected = Boolean(state.accessToken);
  connectPanel.classList.toggle("hidden", connected);
  devicePanel.classList.toggle("hidden", !connected);
  capturePanel.classList.toggle("hidden", !connected);

  if (state.user) {
    $("user-email").textContent = state.user.email;
  }

  if (state.device) {
    $("device-name-readonly").textContent = state.device.name || "Ledger device";
  }

  if (state.appUrl) {
    appUrlInput.value = state.appUrl;
  }

  if (state.draft) {
    fillDraft(state.draft);
  }
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
  } catch (error) {
    showMessage(error.message, "error");
  }
}

$("connect-button").addEventListener("click", async () => {
  clearMessage();
  try {
    const result = await sendMessage("LEDGER_CONNECT", {
      appUrl: appUrlInput.value.trim() || "http://localhost:3000",
      token: tokenInput.value.trim(),
      name: deviceNameInput.value.trim() || "Ledger Chrome Extension",
    });
    tokenInput.value = "";
    setConnectedState({
      accessToken: result.accessToken,
      appUrl: appUrlInput.value.trim(),
      user: result.user,
      device: { name: deviceNameInput.value.trim(), expiresAt: result.expiresAt },
    });
    showMessage("Extension connected. You can now capture and save bets.");
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
    });
    showMessage("Session refreshed.");
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
    showMessage(draftSummary(draft));
  } catch (error) {
    showMessage(error.message, "error");
  }
});

$("preview-button").addEventListener("click", async () => {
  clearMessage();
  try {
    const draft = await sendMessage("LEDGER_PREVIEW_DRAFT", mapDraftFromForm());
    fillDraft(draft);
    showMessage("Draft normalized by Ledger. Review and save when ready.");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

$("save-button").addEventListener("click", async () => {
  clearMessage();
  try {
    const result = await sendMessage("LEDGER_SAVE_DRAFT", mapDraftFromForm());
    showMessage(`Saved to Ledger: ${result.bet.eventName}`);
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
  } catch (error) {
    showMessage(error.message, "error");
  }
});

boot();
