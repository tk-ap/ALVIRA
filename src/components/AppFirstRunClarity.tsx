import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

const topicLabels: Record<string, string> = {
  "My communication style and decision-making process": "Write or communicate in a way that sounds like me",
  "My daily routines, habits, and personal workflows": "Plan and organize everyday life",
  "My values, boundaries, and what I won't compromise on": "Think through choices without losing what matters to me",
  "My key relationships and how I collaborate with others": "Handle work, family, or collaboration more thoughtfully",
  "My goals, priorities, and how I evaluate tradeoffs": "Make decisions about goals, priorities, or next steps",
};

function exactText<T extends HTMLElement>(root: ParentNode, selector: string, text: string): T | undefined {
  return Array.from(root.querySelectorAll<T>(selector)).find((element) => element.textContent?.trim() === text);
}

function replaceExactText(root: ParentNode, selector: string, from: string, to: string) {
  const element = exactText<HTMLElement>(root, selector, from) ?? exactText<HTMLElement>(root, selector, to);
  if (element && element.textContent?.trim() !== to) element.textContent = to;
  return element;
}

function applyFirstRunClarity() {
  const main = document.querySelector<HTMLElement>("main#main-content");
  if (!main) return;

  const contextHeading =
    exactText<HTMLHeadingElement>(main, "h1", "Build your ALVIRA Context") ??
    exactText<HTMLHeadingElement>(main, "h1", "What would you like AI to help you with?");

  const contextLabel =
    exactText<HTMLLabelElement>(main, "label", "What should your AI know about you?") ??
    exactText<HTMLLabelElement>(main, "label", "Start with what you want help with");

  const isContextStart = Boolean(contextHeading || contextLabel);

  if (!isContextStart) {
    delete main.dataset.alviraBeginnerStart;
    return;
  }

  main.dataset.alviraBeginnerStart = "true";

  if (contextHeading && contextHeading.textContent?.trim() !== "What would you like AI to help you with?") {
    contextHeading.textContent = "What would you like AI to help you with?";
  }

  const intro = contextHeading?.nextElementSibling;
  if (intro instanceof HTMLParagraphElement) {
    const copy = "You do not need to know what AI can do yet. Choose anything that sounds useful. ALVIRA will ask a few questions, show you where AI may help, and build the background that makes future help more personal.";
    if (intro.textContent?.trim() !== copy) intro.textContent = copy;
  }

  replaceExactText(main, "p", "What would you like to build?", "Choose what you need");
  replaceExactText(main, "label", "What should your AI know about you?", "Start with what you want help with");
  replaceExactText(
    main,
    "legend",
    "Examples of what ALVIRA helps you uncover (select all that apply)",
    "Choose anything that sounds useful (you can pick more than one)",
  );
  replaceExactText(main, "p", "For individuals", "Everyday starting points");
  replaceExactText(main, "button", "Start interview", "Start the conversation");

  const contextButton =
    exactText<HTMLButtonElement>(main, "button", "ALVIRA Context") ??
    exactText<HTMLButtonElement>(main, "button", "Help AI understand me");
  if (contextButton) {
    if (contextButton.textContent?.trim() !== "Help AI understand me") contextButton.textContent = "Help AI understand me";
    contextButton.setAttribute("aria-label", "Help AI understand me with ALVIRA Context");
  }

  const reflectButton =
    exactText<HTMLButtonElement>(main, "button", "ALVIRA Reflect") ??
    exactText<HTMLButtonElement>(main, "button", "Reflect on my direction");
  if (reflectButton) {
    if (reflectButton.textContent?.trim() !== "Reflect on my direction") reflectButton.textContent = "Reflect on my direction";
    reflectButton.setAttribute("aria-label", "Reflect on my direction with ALVIRA Reflect");
  }

  Object.entries(topicLabels).forEach(([from, to]) => {
    replaceExactText(main, "span", from, to);
  });

  const customTopic = Array.from(main.querySelectorAll<HTMLInputElement>('input[type="text"]')).find((input) =>
    ["Add your own topic...", "Something else I could use help with..."].includes(input.placeholder),
  );
  if (customTopic && customTopic.placeholder !== "Something else I could use help with...") {
    customTopic.placeholder = "Something else I could use help with...";
  }

  const whatYouGet = Array.from(main.querySelectorAll<HTMLElement>("strong")).find((element) =>
    ["What you'll get:", "What happens next:"].includes(element.textContent?.trim() ?? ""),
  );
  const technicalPanel = whatYouGet?.parentElement;
  if (technicalPanel instanceof HTMLElement) {
    technicalPanel.dataset.alviraBeginnerTechnical = "true";
    if (whatYouGet?.textContent?.trim() !== "What happens next:") whatYouGet.textContent = "What happens next:";
  }

  const outputLabel = Array.from(main.querySelectorAll<HTMLElement>("span")).find((element) =>
    element.textContent?.trim() === "<output-files />",
  );
  const outputAside = outputLabel?.closest("aside");
  if (outputAside instanceof HTMLElement) {
    outputAside.dataset.alviraBeginnerOutput = "true";
    if (outputAside.parentElement) outputAside.parentElement.dataset.alviraBeginnerLayout = "true";
  }

  const addContextLabel = Array.from(main.querySelectorAll<HTMLElement>("span")).find((element) =>
    element.textContent?.trim() === "<add-context />",
  );
  const addContextPanel = addContextLabel?.closest("section");
  if (addContextPanel instanceof HTMLElement) addContextPanel.dataset.alviraBeginnerAdvanced = "true";
}

export function AppFirstRunClarity() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/app") return;

    const run = () => window.requestAnimationFrame(applyFirstRunClarity);
    const frame = run();
    const observer = new MutationObserver(() => {
      run();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      const main = document.querySelector<HTMLElement>("main#main-content");
      if (main) delete main.dataset.alviraBeginnerStart;
    };
  }, [location.pathname, location.search]);

  if (location.pathname !== "/app") return null;

  return (
    <style>{`
      html[data-alvira-route="app"] main[data-alvira-beginner-start="true"] [data-alvira-beginner-layout="true"] {
        grid-template-columns: minmax(0, 1fr) !important;
        max-width: 46rem;
        margin-inline: auto;
      }

      html[data-alvira-route="app"] main[data-alvira-beginner-start="true"] [data-alvira-beginner-output="true"] {
        display: none;
      }

      @media (max-width: 767px) {
        html[data-alvira-route="app"] main[data-alvira-beginner-start="true"] {
          align-items: flex-start;
          padding-top: 2rem;
          padding-bottom: 3rem;
        }

        html[data-alvira-route="app"] main[data-alvira-beginner-start="true"] [data-alvira-beginner-technical="true"],
        html[data-alvira-route="app"] main[data-alvira-beginner-start="true"] [data-alvira-beginner-advanced="true"] {
          display: none;
        }
      }
    `}</style>
  );
}
