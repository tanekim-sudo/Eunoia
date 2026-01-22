
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DecisionContext, ValueAttribute, DecisionAnalysis, CustomVoice } from "../types";
import { DECISION_DIMENSIONS } from "../constants";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for Suggested Values
const valuesSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    suggestedValues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          weight: { type: Type.NUMBER, description: "Suggested default weight 0-100" },
          minLabel: { type: Type.STRING, description: "Label for the 0 end of the slider" },
          maxLabel: { type: Type.STRING, description: "Label for the 100 end of the slider" },
          rangeStatements: {
              type: Type.OBJECT,
              properties: {
                  low: { type: Type.STRING, description: "A specific, first-person statement describing the stance if this value is set low (0-33). E.g. 'I prioritize safety above all else.'" },
                  mid: { type: Type.STRING, description: "A specific, first-person statement describing the stance if this value is set to mid (34-66). E.g. 'I want a balance of safety and growth.'" },
                  high: { type: Type.STRING, description: "A specific, first-person statement describing the stance if this value is set to high (67-100). E.g. 'I am willing to risk it all for growth.'" }
              },
              required: ["low", "mid", "high"]
          },
          firstPrinciplePrompt: { type: Type.STRING, description: "A probing question to help the user uncover their true stance on this value." }
        },
        required: ["name", "description", "category", "weight", "minLabel", "maxLabel", "rangeStatements", "firstPrinciplePrompt"]
      }
    }
  },
  required: ["suggestedValues"]
};

// Schema for Breakdown
const breakdownSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        subFactors: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: { type: Type.STRING },
                    weight: { type: Type.NUMBER },
                    minLabel: { type: Type.STRING },
                    maxLabel: { type: Type.STRING },
                    rangeStatements: {
                        type: Type.OBJECT,
                        properties: {
                            low: { type: Type.STRING },
                            mid: { type: Type.STRING },
                            high: { type: Type.STRING }
                        },
                        required: ["low", "mid", "high"]
                    },
                    firstPrinciplePrompt: { type: Type.STRING }
                },
                required: ["name", "description", "category", "weight", "minLabel", "maxLabel", "rangeStatements", "firstPrinciplePrompt"]
            }
        }
    },
    required: ["subFactors"]
}

// Schema for Full Analysis (McKinsey Style)
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: {
        type: Type.OBJECT,
        properties: {
            situation: { type: Type.STRING, description: "The context and background." },
            complication: { type: Type.STRING, description: "The core dilemma or tension." },
            resolution: { type: Type.STRING, description: "The final recommendation." }
        },
        required: ["situation", "complication", "resolution"]
    },
    strategicRationale: {
        type: Type.OBJECT,
        properties: {
            pillars: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.STRING, description: "Detailed explanation of this strategic pillar." }
                    },
                    required: ["title", "content"]
                }
            }
        },
        required: ["pillars"]
    },
    implementationPlan: {
        type: Type.OBJECT,
        properties: {
            immediateActions: { type: Type.ARRAY, items: { type: Type.STRING } },
            resourceImplications: { type: Type.STRING },
            communicationStrategy: { type: Type.STRING }
        },
        required: ["immediateActions", "resourceImplications", "communicationStrategy"]
    },
    confidenceScore: { type: Type.NUMBER, description: "0-100 score indicating robustness of the decision." },
    valuesAlignmentScore: { type: Type.NUMBER, description: "0-100 score of how well this decision fits the user's specific value weights." },
    
    inferredContext: {
        type: Type.OBJECT,
        properties: {
            stakes: { type: Type.STRING, description: "Inferred stakes (Low/Medium/High/Critical)" },
            timeHorizon: { type: Type.STRING, description: "Inferred time horizon for the decision" },
            keyConstraints: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of hard constraints extracted from context/files"
            }
        },
        required: ["stakes", "timeHorizon", "keyConstraints"]
    },

    summary: { type: Type.STRING, description: "A 'Reasoning Compression' summary. Highly condensed, essential logic." },
    assumptions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          statement: { type: Type.STRING },
          validityScore: { type: Type.NUMBER },
          riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
          impactIfFalse: { type: Type.STRING, description: "What happens if this assumption is wrong?" }
        },
        required: ["statement", "validityScore", "riskLevel", "impactIfFalse"]
      }
    },
    tradeoffs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          gain: { type: Type.STRING },
          loss: { type: Type.STRING },
          impactScore: { type: Type.NUMBER },
          winner: { type: Type.STRING, description: "Which side of the tradeoff wins based on value weights?" }
        },
        required: ["gain", "loss", "impactScore", "winner"]
      }
    },
    agents: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          archetype: { type: Type.STRING },
          verdict: { type: Type.STRING, enum: ["Approve", "Reject", "Caution", "Dissent"] },
          reasoning: { type: Type.STRING },
          keyConcern: { type: Type.STRING },
          score: { type: Type.NUMBER, description: "0-100 agreement level" },
          isCustom: { type: Type.BOOLEAN, description: "True if this matches one of the user's custom voices/versions." }
        },
        required: ["name", "archetype", "verdict", "reasoning", "keyConcern", "score"]
      }
    },
    contingencies: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          triggerCondition: { type: Type.STRING, description: "The specific event that breaks the decision." },
          probability: { type: Type.STRING },
          impact: { type: Type.STRING },
          mitigationPlan: { type: Type.STRING }
        },
        required: ["triggerCondition", "probability", "impact", "mitigationPlan"]
      }
    },
    shadowDecision: {
      type: Type.OBJECT,
      properties: {
        alternativeOption: { type: Type.STRING, description: "The strongest counter-option." },
        reasoning: { type: Type.STRING, description: "Why a rational person might choose this instead." },
        whyRejected: { type: Type.STRING, description: "Why it was rejected based on SPECIFIC user value weights." }
      },
      required: ["alternativeOption", "reasoning", "whyRejected"]
    }
  },
  required: ["executiveSummary", "strategicRationale", "implementationPlan", "confidenceScore", "valuesAlignmentScore", "inferredContext", "summary", "assumptions", "tradeoffs", "agents", "contingencies", "shadowDecision"]
};

// 1. SUGGEST VALUES (AI generates the "Decision DNA")
export const suggestValues = async (context: DecisionContext): Promise<ValueAttribute[]> => {
    const systemPrompt = `
      Act as EUNOIA, an expert decision architect.
      Analyze the user's dilemma and Identify the 5-7 most critical "Decision Dimensions" that will determine the outcome.
      
      REFER TO THIS KNOWLEDGE BASE OF DIMENSIONS:
      ${DECISION_DIMENSIONS}
      
      Task:
      - Select dimensions relevant to the specific context (e.g. if it's a startup, choose 'Burn Rate' or 'Speed'. If it's ethics, choose 'Integrity').
      - Define clear "Min" (0) and "Max" (100) labels so the user knows what the slider means.
      - Generate 3 narrative "Range Statements" (Low, Mid, High) that describe exactly what that score means for the user in the first person.
        - Low: "I prefer..."
        - Mid: "I want to balance..."
        - High: "I am prioritizing..."
      - Suggest a default weight based on the implied tone of the text.
      - Generate a "First Principle Prompt" for each value. This is a deep, probing question that forces the user to think about their true preference.
      
      Input Context:
      Title: ${context.title}
      Description: ${context.description}
    `;
    
    // Construct parts (include files if needed for context inference)
    const parts: any[] = [{ text: systemPrompt }];
    if (context.files && context.files.length > 0) {
        context.files.forEach(file => {
             if (!file.isImage) {
                 parts.push({ text: `\nFile (${file.name}):\n${file.content}\n` });
             }
        });
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { role: 'user', parts: parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: valuesSchema
            }
        });
        
        const data = JSON.parse(response.text || "{}");
        // Add IDs
        return data.suggestedValues.map((v: any, i: number) => ({ ...v, id: `val_${Date.now()}_${i}` }));
    } catch (error) {
        console.error("Value Suggestion Failed:", error);
        throw error;
    }
}

// 2. BREAK DOWN FACTOR (Fractal Generation)
export const breakDownFactor = async (factor: ValueAttribute, context: DecisionContext): Promise<ValueAttribute[]> => {
    const systemPrompt = `
        Act as EUNOIA.
        The user wants to "Break Down" a specific decision dimension into its first-principle components (Sub-Factors).
        
        Parent Factor: ${factor.name}
        Context Description: ${factor.description}
        Parent Prompt: ${factor.firstPrinciplePrompt}
        
        Overall Decision Context:
        Title: ${context.title}
        
        Task:
        - Generate 3-4 granular sub-factors that make up this parent factor.
        - Include "Range Statements" (Low, Mid, High) for each sub-factor.
        - Provide default weights based on the parent's current weight (${factor.weight}).
    `;

     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { role: 'user', parts: [{ text: systemPrompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: breakdownSchema
            }
        });
        
        const data = JSON.parse(response.text || "{}");
        return data.subFactors.map((v: any, i: number) => ({ ...v, id: `${factor.id}_sub_${i}` }));
    } catch (error) {
        console.error("Breakdown Failed:", error);
        throw error;
    }
}

// 3. ANALYZE DECISION (Strict adherence to weights)
export const analyzeDecision = async (
  context: DecisionContext,
  values: ValueAttribute[],
  customVoices: CustomVoice[] = []
): Promise<DecisionAnalysis> => {
  
  // Recursively format values to string
  const formatValue = (v: ValueAttribute, depth: number = 0): string => {
      const indent = "  ".repeat(depth);
      let output = `${indent}- ${v.name} (${v.category}): Set to ${v.weight}/100. [0 = ${v.minLabel}, 100 = ${v.maxLabel}].\n${indent}  Description: ${v.description}`;
      
      if (v.rangeStatements) {
          // Include the currently active statement to help the AI understand the user's specific stance
          let activeStatement = v.rangeStatements.mid;
          if (v.weight <= 33) activeStatement = v.rangeStatements.low;
          else if (v.weight >= 67) activeStatement = v.rangeStatements.high;
          
          output += `\n${indent}  User Stance: "${activeStatement}"`;
      }

      if (v.userNotes) {
          output += `\n${indent}  User Reasoning Note: "${v.userNotes}"`;
      }
      
      if (v.subFactors && v.subFactors.length > 0) {
          output += `\n${indent}  Detailed Breakdown:\n` + v.subFactors.map(sub => formatValue(sub, depth + 1)).join('\n');
      }
      return output;
  };

  const valuesDescription = values.map(v => formatValue(v)).join('\n');
  
  const voicesPrompt = customVoices.length > 0 
      ? `\n\nREQUIRED PERSPECTIVES (CUSTOM VOICES):\nIn the 'agents' array, you MUST include perspectives for these specific User Versions/Voices:\n` + 
        customVoices.map(v => `- Name: "${v.name}". Description: ${v.description}`).join('\n')
      : "";

  const systemPrompt = `
    Act as EUNOIA, a senior strategy consultant (McKinsey/BCG level) and neuro-symbolic decision engine.
    
    CORE DIRECTIVE:
    You must calculate the decision outcome based STRICTLY on the user's defined value weights.
    
    OUTPUT FORMAT REQUIREMENTS:
    - Executive Summary: Use the SCR (Situation, Complication, Resolution) framework.
    - Rationale: Provide 3 distinct "Strategic Pillars" supporting the recommendation.
    - Agents: Generate standard rational agents AND the specific "Custom Voices" requested below.
    - Language: Professional, concise, board-ready. No fluff.

    USER'S CONSTITUTION (VALUES):
    ${valuesDescription}
    
    ${voicesPrompt}

    DECISION CONTEXT:
    Title: ${context.title}
    Description: ${context.description}
  `;

  const parts: any[] = [{ text: systemPrompt }];

  if (context.files && context.files.length > 0) {
      parts.push({ text: "\n\nATTACHED DOCUMENTS:\n" });
      context.files.forEach(file => {
          if (file.isImage) {
              parts.push({
                  inlineData: {
                      mimeType: file.type,
                      data: file.content
                  }
              });
          } else {
              parts.push({
                  text: `\n--- FILE: ${file.name} ---\n${file.content}\n--- END FILE ---\n`
              });
          }
      });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
          role: 'user',
          parts: parts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        thinkingConfig: { thinkingBudget: 4096 },
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as DecisionAnalysis;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};
