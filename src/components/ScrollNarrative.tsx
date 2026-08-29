import { useEffect } from "react";

const SCENE_LABELS: Array<[string, string]> = [
  ["Why Context Intelligence", "why-context"],
  ["Autonomy without context", "autonomy"],
  ["Capability is not understanding", "capability"],
  ["How ALVIRA builds context", "sources"],
  ["A living system", "living-loop"],
  ["Evidence of understanding", "evidence"],
  ["Portable by design", "portability"],
  ["Begin with context", "final-cta"],
];

const exactText = (root: Element, selector: string, text: string) =>
  Array.from(root.querySelectorAll<HTMLElement>(selector)).find(
    (element) => element.textContent?.trim() === text,
  );

const markStep = (element: Element | null | undefined) => {
  if (element instanceof HTMLElement) element.dataset.scrollStep = "true";
};

function markSceneSteps(section: HTMLElement, scene: string) {
  if (scene === "why-context") {
    ["Goals", "Constraints", "History", "Preferences", "Decisions", "Projects"].forEach((label) =>
      markStep(exactText(section, "div", label)),
    );
    markStep(exactText(section, "p", "ALVIRA Context")?.closest("div.border"));
    markStep(exactText(section, "span", "Reusable")?.closest("div.flex-1"));
    return;
  }

  if (scene === "autonomy") {
    const panels = Array.from(section.querySelectorAll<HTMLElement>("div.border"))
      .filter((panel) => panel.textContent?.includes("PROMPT"));
    panels.slice(0, 2).forEach(markStep);
    return;
  }

  if (scene === "capability") {
    ["Capability becomes generic.", "Autonomy amplifies the gap.", "Context turns raw capability into situated judgment."].forEach((label) =>
      markStep(exactText(section, "h3", label)?.parentElement),
    );
    return;
  }

  if (scene === "sources") {
    ["Conversation", "Documents", "Links", "Files"].forEach((label) =>
      markStep(exactText(section, "h3", label)?.parentElement),
    );
    markStep(exactText(section, "p", "Seed what is known. Trust strong context. Ask only for genuine gaps.")?.parentElement);
    return;
  }

  if (scene === "living-loop") {
    Array.from(section.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')).forEach(markStep);
    return;
  }

  if (scene === "evidence") {
    const stateMap = [
      ["Carried forward", "known"],
      ["Still uncertain", "uncertain"],
      ["Changed", "changed"],
      ["Ready to reuse", "reusable"],
    ] as const;

    const rows = stateMap
      .map(([label, state]) => {
        const row = exactText(section, "h3", label)?.parentElement;
        if (row instanceof HTMLElement) {
          row.dataset.evidenceState = state;
          markStep(row);
        }
        return row;
      })
      .filter((row): row is HTMLElement => row instanceof HTMLElement);

    const inspector = rows[0]?.parentElement;
    if (inspector) {
      inspector.dataset.evidenceInspector = "true";
      markStep(inspector);
    }
    return;
  }

  if (scene === "portability") {
    ["ChatGPT", "Claude", "Gemini", "Cursor", "Your agents"].forEach((label) =>
      markStep(exactText(section, "span", label)),
    );
    return;
  }

  if (scene === "final-cta") {
    markStep(section.querySelector("h2"));
    markStep(section.querySelector("h2")?.nextElementSibling);
    markStep(section.querySelector('a[href="/app"]'));
  }
}

export function ScrollNarrative() {
  useEffect(() => {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    if (path !== "/" && path !== "/ALVIRA") return;

    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sections = Array.from(document.querySelectorAll<HTMLElement>("main > section"));
    const observed: HTMLElement[] = [];

    sections.forEach((section) => {
      const text = section.textContent ?? "";
      const match = SCENE_LABELS.find(([label]) => text.includes(label));
      if (!match) return;

      const [, scene] = match;
      section.dataset.scrollScene = scene;
      markSceneSteps(section, scene);

      if (reducedMotion.matches) {
        section.dataset.scrollVisible = "true";
        return;
      }

      section.dataset.scrollReveal = "true";
      const steps = Array.from(section.querySelectorAll<HTMLElement>('[data-scroll-step="true"]'));
      steps.forEach((step, index) => {
        step.style.setProperty("--scroll-delay", `${Math.min(index * 85, 425)}ms`);
      });
      observed.push(section);
    });

    if (reducedMotion.matches) {
      return () => {
        sections.forEach((section) => {
          delete section.dataset.scrollVisible;
          delete section.dataset.scrollScene;
        });
      };
    }

    root.dataset.scrollEnhanced = "true";

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const section = entry.target as HTMLElement;
          const visible = entry.isIntersecting && entry.intersectionRatio >= 0.08;
          section.dataset.scrollInView = visible ? "true" : "false";
          if (visible) section.dataset.scrollVisible = "true";

          if (section.dataset.scrollScene === "living-loop") {
            document.dispatchEvent(
              new CustomEvent("alvira:living-loop-visibility", { detail: { visible } }),
            );
          }
        });
      },
      {
        threshold: [0, 0.08, 0.2, 0.4, 0.65],
        rootMargin: "-6% 0px -10% 0px",
      },
    );

    observed.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
      observed.forEach((section) => {
        delete section.dataset.scrollReveal;
        delete section.dataset.scrollVisible;
        delete section.dataset.scrollInView;
        delete section.dataset.scrollScene;
      });
      delete root.dataset.scrollEnhanced;
    };
  }, []);

  return null;
}
