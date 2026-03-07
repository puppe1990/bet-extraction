const DEFAULT_APP_URL = "http://localhost:3000";

async function getState() {
  const data = await chrome.storage.local.get([
    "appUrl",
    "accessToken",
    "user",
    "device",
    "draft",
    "home",
  ]);

  return {
    appUrl: data.appUrl || DEFAULT_APP_URL,
    accessToken: data.accessToken || null,
    user: data.user || null,
    device: data.device || null,
    draft: data.draft || null,
    home: data.home || null,
  };
}

async function setState(next) {
  await chrome.storage.local.set(next);
  return getState();
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error || "Request failed.");
  }

  return json;
}

async function loginWithPassword({ appUrl, email, password, name }) {
  const json = await fetchJson(`${appUrl}/api/extension/session/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  await setState({
    appUrl,
    accessToken: json.accessToken,
    user: json.user,
    device: {
      name,
      expiresAt: json.expiresAt,
    },
    home: null,
  });

  return json;
}

async function signupWithPassword({ appUrl, email, password, confirmPassword, name }) {
  const json = await fetchJson(`${appUrl}/api/extension/session/signup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, confirmPassword, name }),
  });

  await setState({
    appUrl,
    accessToken: json.accessToken,
    user: json.user,
    device: {
      name,
      expiresAt: json.expiresAt,
    },
    home: null,
  });

  return json;
}

async function getAuthHeaders() {
  const state = await getState();
  if (!state.accessToken) {
    throw new Error("Extension is not connected.");
  }

  return {
    "content-type": "application/json",
    authorization: `Bearer ${state.accessToken}`,
  };
}

async function refreshMe() {
  const state = await getState();
  const headers = await getAuthHeaders();
  const json = await fetchJson(`${state.appUrl}/api/extension/me`, {
    method: "GET",
    headers,
  });

  await setState({
    user: json.user,
    device: json.device,
    home: json.home,
  });

  return json;
}

async function captureActiveTabDraft() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error("No active tab.");
  }

  const response = await chrome.tabs.sendMessage(tab.id, {
    type: "LEDGER_CAPTURE_DRAFT",
  });

  if (!response?.draft) {
    throw new Error("No draft available on this page.");
  }

  await setState({ draft: response.draft });
  return response.draft;
}

async function previewDraft(draft) {
  const state = await getState();
  const headers = await getAuthHeaders();
  const json = await fetchJson(`${state.appUrl}/api/extension/bets/draft`, {
    method: "POST",
    headers,
    body: JSON.stringify(draft),
  });

  await setState({ draft: json });
  return json;
}

async function saveDraft(draft) {
  const state = await getState();
  const headers = await getAuthHeaders();
  const json = await fetchJson(`${state.appUrl}/api/extension/bets/create`, {
    method: "POST",
    headers,
    body: JSON.stringify(draft),
  });

  await setState({ draft: null });
  return json;
}

async function addBankrollTransaction(payload) {
  const state = await getState();
  const headers = await getAuthHeaders();
  const json = await fetchJson(`${state.appUrl}/api/extension/bankroll/transaction`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  return json;
}

async function settleExtensionBet(payload) {
  const state = await getState();
  const headers = await getAuthHeaders();
  const json = await fetchJson(`${state.appUrl}/api/extension/bets/settle`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  return json;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const run = async () => {
    switch (message.type) {
      case "LEDGER_GET_STATE":
        return getState();
      case "LEDGER_LOGIN":
        return loginWithPassword(message.payload);
      case "LEDGER_SIGNUP":
        return signupWithPassword(message.payload);
      case "LEDGER_REFRESH_ME":
        return refreshMe();
      case "LEDGER_CAPTURE_ACTIVE_TAB":
        return captureActiveTabDraft();
      case "LEDGER_PREVIEW_DRAFT":
        return previewDraft(message.payload);
      case "LEDGER_SAVE_DRAFT":
        return saveDraft(message.payload);
      case "LEDGER_ADD_BANKROLL_TRANSACTION":
        return addBankrollTransaction(message.payload);
      case "LEDGER_SETTLE_BET":
        return settleExtensionBet(message.payload);
      case "LEDGER_DISCONNECT":
        await chrome.storage.local.clear();
        return { success: true };
      default:
        throw new Error("Unknown message.");
    }
  };

  run()
    .then((result) => sendResponse({ ok: true, result }))
    .catch((error) =>
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown extension error.",
      }),
    );

  return true;
});
