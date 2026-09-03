const contextField = document.getElementById("context");
const status = document.getElementById("status");

chrome.storage.local.get(["alviraContextView"], (result) => {
  contextField.value = result.alviraContextView || "";
});

document.getElementById("save").addEventListener("click", () => {
  const value = contextField.value.trim();
  chrome.storage.local.set({ alviraContextView: value }, () => {
    status.textContent = value ? "Saved. Open a supported AI site and click ALVIRA." : "Nothing saved.";
  });
});

document.getElementById("clear").addEventListener("click", () => {
  chrome.storage.local.remove(["alviraContextView"], () => {
    contextField.value = "";
    status.textContent = "Cleared from this browser.";
  });
});
