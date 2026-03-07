const $ = (id) => document.getElementById(id);

const connectPanel = $("connect-panel");
const devicePanel = $("device-panel");
const homePanel = $("home-panel");
const capturePanel = $("capture-panel");
const messagePanel = $("message-panel");
const messageBody = $("message-body");

const appUrlInput = $("app-url");
const emailInput = $("email");
const passwordInput = $("password");
const confirmPasswordField = $("confirm-password-field");
const confirmPasswordInput = $("confirm-password");
const deviceNameInput = $("device-name");
const openAppLink = $("open-app-link");
const authButton = $("auth-button");
const modeLoginButton = $("mode-login");
const modeSignupButton = $("mode-signup");

const homeBalance = $("home-balance");
const homePlan = $("home-plan");
const homeUsage = $("home-usage");
const recentBetsList = $("recent-bets");

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

let authMode = "login";

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

function setAuthMode(nextMode) {
  authMode = nextMode;
  const signup = nextMode === "signup";
  modeLoginButton.classList.toggle("active", !signup);
  modeSignupButton.classList.toggle("active", signup);
  confirmPasswordField.classList.toggle("hidden", !signup);
  authButton.textContent = signup ? "Create account" : "Sign in";
  openAppLink.textContent = signup ? "Open web signup" : "Open web app";
  openAppLink.href = `${(appUrlInput.value.trim() || "http://localhost:3000").replace(/\/$/, "")}/login`;
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

function renderHome(home) {
  const hasHome = Boolean(home);
  homePanel.classList.toggle("hidden", !hasHome);
  if (!hasHome) {
    recentBetsList.innerHTML = "";
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
    `;
    recentBetsList.appendChild(item);
  }
}

function setConnectedState(state) {
  const connected = Boolean(state.accessToken);
  connectPanel.classList.toggle("hidden", connected);
  devicePanel.classList.toggle("hidden", !connected);
  capturePanel.classList.toggle("hidden", !connected);
  homePanel.classList.toggle("hidden", !connected);

  if (state.user) {
    $("user-email").textContent = state.user.email;
  }

  if (state.device) {
    $("device-name-readonly").textContent = state.device.name || "Ledger device";
  }

  if (state.appUrl) {
    appUrlInput.value = state.appUrl;
    openAppLink.href = `${state.appUrl.replace(/\/$/, "")}/login`;
  }

  renderHome(state.home);

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
    setAuthMode("login");
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

modeLoginButton.addEventListener("click", () => setAuthMode("login"));
modeSignupButton.addEventListener("click", () => setAuthMode("signup"));

appUrlInput.addEventListener("input", () => {
  const appUrl = appUrlInput.value.trim() || "http://localhost:3000";
  openAppLink.href = `${appUrl.replace(/\/$/, "")}/login`;
});

authButton.addEventListener("click", async () => {
  clearMessage();
  try {
    const appUrl = appUrlInput.value.trim() || "http://localhost:3000";
    const payload = {
      appUrl,
      email: emailInput.value.trim(),
      password: passwordInput.value,
      confirmPassword: confirmPasswordInput.value,
      name: deviceNameInput.value.trim() || "Ledger Chrome Extension",
    };

    const action = authMode === "signup" ? "LEDGER_SIGNUP" : "LEDGER_LOGIN";
    const result = await sendMessage(action, payload);
    passwordInput.value = "";
    confirmPasswordInput.value = "";

    const refreshed = await sendMessage("LEDGER_REFRESH_ME");
    setConnectedState({
      accessToken: result.accessToken,
      appUrl,
      user: refreshed.user,
      device: refreshed.device,
      home: refreshed.home,
      draft: null,
    });
    showMessage(
      authMode === "signup"
        ? "Account created. You can now capture and save bets."
        : "Signed in. You can now capture and save bets.",
    );
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

boot();
