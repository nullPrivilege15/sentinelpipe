const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");
const log = document.getElementById("chat-log");
const inspectorSystem = document.getElementById("inspector-system");
const inspectorUser = document.getElementById("inspector-user");
const inspectorToggle = document.getElementById("inspector-toggle");
const inspector = document.getElementById("inspector");
const presetChips = document.querySelectorAll(".chip");

inspectorToggle.addEventListener("click", () => {
  inspector.classList.toggle("open");
});

presetChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    input.value = chip.dataset.payload;
    input.focus();
  });
});

// --- FIX (info disclosure): the patched backend never returns the
// system prompt to the client, so the live Prompt Inspector panel is
// replaced with a static note explaining the structural fix instead.
function showStaticInspectorNote() {
  inspectorSystem.textContent =
    "[not sent to client] Patched build: system content is passed to " +
    "the model via a separate 'system' role and is never included in " +
    "API responses.";
  inspectorUser.textContent =
    "Only your own message is shown here — there is nothing else to inspect.";
}
showStaticInspectorNote();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  appendUserMessage(message);
  inspectorUser.textContent = message;
  input.value = "";
  const typingEl = appendTypingIndicator();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    typingEl.remove();

    if (data.error) {
      appendBotMessage("Error: " + data.error);
      return;
    }

    appendBotMessage(data.reply);
    // FIX: no updateInspector(data.prompt_debug) call -- that field no
    // longer exists in the patched API response, by design.
  } catch (err) {
    typingEl.remove();
    appendBotMessage("Error: " + err.message);
  }
});

function appendUserMessage(text) {
  const wrap = document.createElement("div");
  wrap.className = "message user";
  const label = document.createElement("span");
  label.className = "msg-label";
  label.textContent = "You";
  const body = document.createElement("div");
  body.className = "msg-body";
  body.textContent = text; // safe: user's own input, rendered as plain text
  wrap.append(label, body);
  log.appendChild(wrap);
  log.scrollTop = log.scrollHeight;
}

function appendBotMessage(text) {
  const wrap = document.createElement("div");
  wrap.className = "message bot";
  wrap.dataset.raw = text; // exact literal text the model returned

  const meta = document.createElement("div");
  meta.className = "msg-meta";

  const label = document.createElement("span");
  label.className = "msg-label";
  label.textContent = "InternBot";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "msg-toggle";
  toggle.textContent = "View raw";
  toggle.addEventListener("click", () => toggleRawView(wrap, toggle));

  meta.append(label, toggle);

  const body = document.createElement("div");
  body.className = "msg-body";

  // --- FIX (LLM05): the model's reply is always inserted as plain text.
  // This is independent of model behavior by design -- it does not
  // matter whether the model outputs HTML, a script tag, or anything
  // else; the browser will never interpret it as markup, only display
  // the literal characters. This is the same fix content-level refusal
  // training can never reliably provide on its own.
  body.textContent = text;

  wrap.append(meta, body);
  log.appendChild(wrap);
  log.scrollTop = log.scrollHeight;
}

function toggleRawView(msgEl, toggleBtn) {
  const body = msgEl.querySelector(".msg-body");
  const showingRaw = msgEl.classList.toggle("raw-view");
  // FIX (LLM05): both views now use textContent. In the patched build
  // there is no meaningful difference between "raw" and "rendered" --
  // that distinction was itself evidence of the vulnerability, since
  // the two views should never diverge once nothing is ever parsed as
  // HTML. Kept as a toggle for UI/comparison purposes only.
  body.textContent = msgEl.dataset.raw;
  toggleBtn.textContent = showingRaw ? "View rendered" : "View raw";
}

function appendTypingIndicator() {
  const wrap = document.createElement("div");
  wrap.className = "message bot typing";
  wrap.innerHTML =
    '<span class="msg-label">InternBot</span>' +
    '<div class="msg-body"><span class="dot-flash"></span><span class="dot-flash"></span><span class="dot-flash"></span></div>';
  log.appendChild(wrap);
  log.scrollTop = log.scrollHeight;
  return wrap;
}
