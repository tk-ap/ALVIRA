// ── Knowledge Graph: defines what domains of knowledge exist per tier ──
// Based on the Alvira Knowledge Schema

// ── Shared types ──
export type Tier = "personal" | "team" | "enterprise";
export type Role = "user" | "assistant";

export interface Message {
  role: Role;
  content: string;
}

export interface InterviewState {
  tier: Tier;
  topic: string;
  domains: Record<
    string,
    {
      answers: string[];
      confidence: number;
      covered: boolean;
    }
  >;
  history: Message[];
  currentDomain: string | null;
}

export interface Domain {
  id: string;
  label: string;
  description: string;
  promptHint: string;
  required: boolean;
  minAnswers: number;
  /** Priority — lower = interview first (1 is highest) */
  priority: number;
  /** Which output file this domain's content belongs to */
  outputFile: "overview" | "requirements" | "constraints" | "businessRules" | "workflows";
}

// ── Playbook: tier-specific interview configuration ──
export interface Playbook {
  tier: Tier;
  phases: string[];           // ordered phases (domain IDs in interview order)
  knowledgePriorities: string[]; // most critical domains
  completion: {
    minimumConfidence: number; // 0-1
    unresolvedGaps: number;    // max gaps allowed before interview is "complete"
  };
  outputs: ("markdown" | "json" | "knowledge_graph")[];
}

export function getPlaybook(tier: Tier): Playbook {
  if (tier === "personal") {
    return {
      tier: "personal",
      phases: ["identity", "goals", "decisionFrameworks", "relationships", "communication"],
      knowledgePriorities: ["identity", "goals", "constraints"],
      completion: {
        minimumConfidence: 0.90,
        unresolvedGaps: 0,
      },
      outputs: ["markdown", "json", "knowledge_graph"],
    };
  }
  // Team and Enterprise use default completion
  return {
    tier,
    phases: [], // flat — use priority ordering
    knowledgePriorities: [],
    completion: {
      minimumConfidence: 0.70,
      unresolvedGaps: 3,
    },
    outputs: ["markdown", "json"],
  };
}

// ── Universal domains (all tiers) ──
const universalDomains: Domain[] = [
  // ── IDENTITY ──
  {
    id: "identity",
    label: "Identity",
    description: "Who the person or organization is — name, mission, vision, values, brand personality, industry, background",
    promptHint: "Ask about their core identity. What is their mission? What values drive them? What industry or domain do they operate in?",
    required: true,
    minAnswers: 1,
    priority: 50,
    outputFile: "overview",
  },
  // ── GOALS ──
  {
    id: "goals",
    label: "Goals",
    description: "Desired outcomes — long-term goals, short-term objectives, success metrics, priorities, KPIs",
    promptHint: "Ask what they're trying to achieve. What does success look like? How do they measure it? What are their top priorities right now?",
    required: true,
    minAnswers: 1,
    priority: 50,
    outputFile: "overview",
  },
  // ── DECISION FRAMEWORKS ──
  {
    id: "decisionFrameworks",
    label: "Decision Frameworks",
    description: "How important decisions are made — approval rules, escalation criteria, prioritization methods, risk tolerance, trade-off preferences",
    promptHint: "Ask how they make important decisions. Who needs to approve? What factors do they weigh? How do they handle trade-offs?",
    required: true,
    minAnswers: 1,
    priority: 50,
    outputFile: "businessRules",
  },
  // ── CONSTRAINTS ──
  {
    id: "constraints",
    label: "Constraints",
    description: "Limitations — policies, compliance requirements, legal restrictions, budget limits, security requirements, non-negotiables",
    promptHint: "Ask about boundaries and limitations. What rules must be followed? What can't be done? Are there budget, legal, or security constraints?",
    required: true,
    minAnswers: 1,
    priority: 50,
    outputFile: "constraints",
  },
  // ── PROCESSES ──
  {
    id: "processes",
    label: "Processes",
    description: "Repeatable workflows — standard operating procedures, customer onboarding, sales process, hiring, incident response, project lifecycle",
    promptHint: "Ask about their recurring processes. Walk me through a typical workflow. What are the steps? Who's involved at each stage?",
    required: false,
    minAnswers: 1,
    priority: 50,
    outputFile: "workflows",
  },
  // ── PEOPLE & ROLES ──
  {
    id: "peopleAndRoles",
    label: "People & Roles",
    description: "Organizational structure — stakeholders, teams, responsibilities, decision makers, subject matter experts",
    promptHint: "Ask about the people involved. Who are the key stakeholders? What roles exist? Who has decision authority? Who has deep expertise?",
    required: false,
    minAnswers: 1,
    priority: 50,
    outputFile: "overview",
  },
  // ── RELATIONSHIPS ──
  {
    id: "relationships",
    label: "Relationships",
    description: "How entities interact — reporting lines, customer journey, vendor relationships, department dependencies, ownership chains",
    promptHint: "Ask how different people or groups relate to each other. Who reports to whom? Which teams depend on each other? What external relationships matter?",
    required: false,
    minAnswers: 1,
    priority: 50,
    outputFile: "overview",
  },
  // ── COMMUNICATION ──
  {
    id: "communication",
    label: "Communication",
    description: "Communication preferences — tone, writing style, vocabulary, reading level, formatting, brand voice",
    promptHint: "Ask about their communication style. How formal or casual? Any preferred formats or channels? Specific terminology they use?",
    required: false,
    minAnswers: 1,
    priority: 50,
    outputFile: "overview",
  },
  // ── TOOLS & SYSTEMS ──
  {
    id: "toolsAndSystems",
    label: "Tools & Systems",
    description: "Technology in use — software, internal systems, APIs, databases, documentation sources",
    promptHint: "Ask what tools and systems they use daily. What software is critical? Any APIs or integrations that matter? Where is documentation stored?",
    required: false,
    minAnswers: 1,
    priority: 50,
    outputFile: "workflows",
  },
  // ── KNOWLEDGE & TERMINOLOGY ──
  {
    id: "knowledgeAndTerminology",
    label: "Knowledge & Terminology",
    description: "Domain expertise — glossary terms, acronyms, industry concepts, internal terminology",
    promptHint: "Ask about specialized knowledge. Are there industry terms or acronyms people should know? Any internal vocabulary that outsiders wouldn't understand?",
    required: false,
    minAnswers: 1,
    priority: 50,
    outputFile: "requirements",
  },
  // ── RULES ──
  {
    id: "rules",
    label: "Rules",
    description: "Operational rules — business rules, approval rules, eligibility criteria, calculation rules",
    promptHint: "Ask about rules that govern their work. Are there specific business rules? What conditions trigger different outcomes? How are calculations done?",
    required: false,
    minAnswers: 1,
    priority: 50,
    outputFile: "businessRules",
  },
  // ── EXCEPTIONS ──
  {
    id: "exceptions",
    label: "Exceptions",
    description: "Situations where rules change — edge cases, special approvals, overrides, emergency procedures",
    promptHint: "Ask about exceptions to the rules. When do normal processes not apply? What edge cases exist? Who can override standard procedures?",
    required: false,
    minAnswers: 1,
    priority: 50,
    outputFile: "constraints",
  },
  // ── UNKNOWNS ──
  {
    id: "unknowns",
    label: "Unknowns",
    description: "Explicitly documented uncertainty — missing information, pending decisions, assumptions, areas requiring human confirmation",
    promptHint: "Ask what they don't know yet. What decisions are pending? What assumptions are they making? What would they need to verify before acting?",
    required: false,
    minAnswers: 1,
    priority: 50,
    outputFile: "constraints",
  },
  // ── FAQS ──
  {
    id: "faqs",
    label: "FAQs",
    description: "Recurring questions — customer questions, employee questions, internal guidance",
    promptHint: "Ask about common questions they encounter. What do people ask most frequently? What confusion comes up repeatedly?",
    required: false,
    minAnswers: 1,
    priority: 50,
    outputFile: "requirements",
  },
];

// ── Personal-only domains (based on ALVIRA Playbook) ──
const personalDomains: Domain[] = [
  {
    id: "background",
    label: "Background",
    description: "Occupation, education, family, pets, location, lifestyle — who this person is",
    promptHint: "Ask about their background. What do they do? Where are they based? What's their family situation?",
    required: true,
    minAnswers: 1,
    priority: 1,
    outputFile: "overview",
  },
  {
    id: "currentProjects",
    label: "Current Projects",
    description: "Active projects, recurring responsibilities, deadlines, long-term initiatives",
    promptHint: "Ask what they're working on right now. What projects are active? Any deadlines coming up?",
    required: true,
    minAnswers: 1,
    priority: 7,
    outputFile: "overview",
  },
  {
    id: "dailyLife",
    label: "Daily Life",
    description: "Daily routine, calendar habits, productivity methods, frequently used apps, devices, automations",
    promptHint: "Ask about their typical day. What does their morning look like? What tools do they use daily? How do they stay organized?",
    required: false,
    minAnswers: 1,
    priority: 8,
    outputFile: "workflows",
  },
  {
    id: "preferences",
    label: "Preferences",
    description: "Personal preferences across all areas — how they like things done, what they value in experiences",
    promptHint: "Ask about their preferences. How do they prefer to receive information? What makes something feel 'right' to them?",
    required: false,
    minAnswers: 1,
    priority: 9,
    outputFile: "overview",
  },
  {
    id: "knowledgeGaps",
    label: "Knowledge Gaps",
    description: "What they don't know, pending decisions, assumptions, areas requiring human confirmation",
    promptHint: "Ask what they're uncertain about. What decisions are pending? What assumptions are they making that should be verified?",
    required: false,
    minAnswers: 1,
    priority: 10,
    outputFile: "constraints",
  },
];

// ── Team/Enterprise domains ──
const orgDomains: Domain[] = [
  {
    id: "productsAndServices",
    label: "Products & Services",
    description: "What the organization offers — products, services, features, pricing models, differentiators",
    promptHint: "Ask about their offerings. What products or services do they provide? What makes them different? How is it priced?",
    required: false,
    minAnswers: 1,
    priority: 50,
    outputFile: "overview",
  },
  {
    id: "customers",
    label: "Customers",
    description: "Intended audiences — customer segments, personas, pain points, buying criteria, common objections",
    promptHint: "Ask about their customers. Who are they serving? What problems do customers have? What objections come up in sales?",
    required: false,
    minAnswers: 1,
    priority: 50,
    outputFile: "requirements",
  },
];

// ── Enterprise-only domains ──
const enterpriseDomains: Domain[] = [
  {
    id: "examples",
    label: "Examples",
    description: "Demonstrations of expected behavior — good responses, bad responses, sample documents, example workflows",
    promptHint: "Ask for concrete examples. Can they share a sample of what good looks like? What does a bad outcome look like?",
    required: false,
    minAnswers: 1,
    priority: 50,
    outputFile: "workflows",
  },
];

// ── Tier-specific graph builder ──
export function getKnowledgeGraph(tier: Tier): Domain[] {
  const base = [...universalDomains];

  if (tier === "personal") {
    return [...base, ...personalDomains];
  }

  const withOrg = [...base, ...orgDomains];

  if (tier === "enterprise") {
    return [...withOrg, ...enterpriseDomains];
  }

  return withOrg; // team
}
