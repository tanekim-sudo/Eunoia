
export enum ViewState {
  LOGIN = 'LOGIN',
  HOME = 'HOME',
  LIBRARY = 'LIBRARY',
  GENERATING_VALUES = 'GENERATING_VALUES',
  VALUES_DIAL = 'VALUES_DIAL',
  ANALYZING = 'ANALYZING',
  ANALYSIS = 'ANALYSIS',
}

export interface ValueAttribute {
  id: string;
  name: string;
  weight: number; // 0-100
  description: string;
  category: string; // e.g. "Values", "Risks", "Goals"
  minLabel: string; // e.g. "Total Caution"
  maxLabel: string; // e.g. "Maximum Growth"
  
  // Narrative Statements for Sliders
  rangeStatements?: {
      low: string;  // 0-33: "I want to avoid all risk..."
      mid: string;  // 34-66: "I am willing to take calculated risks..."
      high: string; // 67-100: "I am going all in..."
  };
  
  // Fractal & Context Features
  firstPrinciplePrompt?: string; // e.g. "What is the irreversible cost?"
  userNotes?: string;
  attachedFiles?: DecisionFile[];
  subFactors?: ValueAttribute[]; // Recursive children
}

export interface DecisionFile {
  id: string;
  name: string;
  type: string;
  content: string; // Base64 for images, text content for text files
  isImage: boolean;
}

export interface DecisionContext {
  id?: string;
  title: string;
  description: string;
  files: DecisionFile[];
  dateCreated?: number;
}

export interface CustomVoice {
    id: string;
    name: string; // e.g. "My Ideal Self"
    description: string; // e.g. "Always prioritizes long-term legacy over short-term gain."
}

export interface Assumption {
  statement: string;
  validityScore: number; // 0-100
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  impactIfFalse: string;
}

export interface Tradeoff {
  gain: string;
  loss: string;
  impactScore: number;
  winner: string; // Which side won based on values
}

export interface AgentPerspective {
  name: string;
  archetype: string;
  verdict: 'Approve' | 'Reject' | 'Caution' | 'Dissent';
  reasoning: string;
  keyConcern: string;
  score: number; // 0-100 support level
  isCustom?: boolean;
}

export interface Contingency {
  triggerCondition: string;
  probability: string; // e.g. "Low", "Medium"
  impact: string;
  mitigationPlan: string;
}

export interface ShadowDecision {
  alternativeOption: string;
  reasoning: string;
  whyRejected: string; // Why the primary decision won over this
}

export interface DecisionAnalysis {
  // McKinsey SCR Framework
  executiveSummary: {
      situation: string;
      complication: string;
      resolution: string;
  };
  
  // Strategic Pillars
  strategicRationale: {
      pillars: { title: string; content: string }[];
  };

  // Execution
  implementationPlan: {
      immediateActions: string[];
      resourceImplications: string;
      communicationStrategy: string;
  };

  confidenceScore: number;
  valuesAlignmentScore: number;
  inferredContext: {
    stakes: string;
    timeHorizon: string;
    keyConstraints: string[];
  };
  summary: string; // "Reasoning Compression"
  assumptions: Assumption[];
  tradeoffs: Tradeoff[];
  agents: AgentPerspective[];
  contingencies: Contingency[];
  shadowDecision: ShadowDecision;
  
  // Legacy support
  recommendation?: string; 
}

export interface SavedDecision {
    id: string;
    context: DecisionContext;
    values: ValueAttribute[];
    analysis: DecisionAnalysis | null;
    lastModified: number;
}
