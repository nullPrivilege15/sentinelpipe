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

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  appendUserMessage(message);
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
    updateInspector(data.prompt_debug);
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

  // --- INTENTIONALLY VULNERABLE ---
  // The model's reply is inserted as raw HTML instead of plain text
  // (which would use body.textContent = text). If the model is
  // manipulated into outputting HTML or a <script> tag, the browser
  // will render/execute it. The "View raw" toggle lets you compare
  // this rendered view against the literal characters returned.
  body.innerHTML = text;

  wrap.append(meta, body);
  log.appendChild(wrap);
  log.scrollTop = log.scrollHeight;
}

function toggleRawView(msgEl, toggleBtn) {
  const body = msgEl.querySelector(".msg-body");
  const showingRaw = msgEl.classList.toggle("raw-view");
  if (showingRaw) {
    body.textContent = msgEl.dataset.raw; // literal characters, not interpreted as HTML
    toggleBtn.textContent = "View rendered";
  } else {
    body.innerHTML = msgEl.dataset.raw; // re-render as HTML — the vulnerable path
    toggleBtn.textContent = "View raw";
  }
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

function updateInspector(promptDebug) {
  if (!promptDebug) return;
  inspectorSystem.textContent = promptDebug.system;
  inspectorUser.textContent = promptDebug.user;
}
