(() => {
  if (window.__alviraConnectLoaded) return;
  window.__alviraConnectLoaded = true;

  const selectors = [
    "#prompt-textarea",
    "rich-textarea [contenteditable='true']",
    "textarea[placeholder]",
    "textarea",
    "div[contenteditable='true'][role='textbox']",
    "div[contenteditable='true']",
  ];

  function visible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }

  function findPromptTarget() {
    const active = document.activeElement;
    if (active && visible(active) && (active.matches?.("textarea") || active.getAttribute?.("contenteditable") === "true")) return active;
    for (const selector of selectors) {
      const candidates = Array.from(document.querySelectorAll(selector));
      const match = candidates.find(visible);
      if (match) return match;
    }
    return null;
  }

  function appendToPrompt(target, context) {
    const prefix = "\n\n---\nALVIRA CONTEXT\n";
    const suffix = "\n---\n";
    const addition = `${prefix}${context}${suffix}`;

    target.focus();
    if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? target.value.length;
      target.setRangeText(addition, start, end, "end");
      target.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: addition }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    if (target.getAttribute("contenteditable") === "true") {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(target);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
      const inserted = document.execCommand("insertText", false, addition);
      target.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: addition }));
      return inserted || true;
    }

    return false;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Use ALVIRA Context";
  button.setAttribute("aria-label", "Insert my saved ALVIRA Context into this prompt");
  Object.assign(button.style, {
    position: "fixed",
    right: "18px",
    bottom: "18px",
    zIndex: "2147483647",
    border: "1px solid rgba(20, 50, 20, .25)",
    borderRadius: "999px",
    padding: "10px 14px",
    background: "#b8dfb8",
    color: "#102710",
    font: "600 12px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace",
    boxShadow: "0 8px 28px rgba(0,0,0,.16)",
    cursor: "pointer",
  });

  button.addEventListener("click", () => {
    chrome.storage.local.get(["alviraContextView"], (result) => {
      const context = (result.alviraContextView || "").trim();
      if (!context) {
        window.alert("No ALVIRA Context is saved in the extension yet. Open the ALVIRA Connect extension and paste a reviewed Context View first.");
        return;
      }
      const target = findPromptTarget();
      if (!target) {
        window.alert("ALVIRA could not find an editable prompt on this page. Click inside the AI prompt box and try again.");
        return;
      }
      appendToPrompt(target, context);
      button.textContent = "Context inserted ✓";
      window.setTimeout(() => { button.textContent = "Use ALVIRA Context"; }, 1800);
    });
  });

  document.documentElement.appendChild(button);
})();
