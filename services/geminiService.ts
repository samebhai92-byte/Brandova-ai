import { GoogleGenAI } from "@google/genai";
import { GeneratorInput } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateContent = async (input: GeneratorInput): Promise<string> => {
  try {
    let prompt = '';
    const platform = input.platform || 'General';
    const systemInstruction = `You are Brandova AI, a professional branding specialist. 
    Language: ${input.language}. 
    Style: ${input.style}. 
    Target Audience: ${input.audience}. 
    Platform: ${platform}.
    Output: Clean, structured text without markdown artifacts unless necessary. High-end tone.`;

    switch (input.type) {
      case 'brand_name':
        prompt = `Propose 10 premium brand names for: ${input.description}. Include a concise 3-word definition for each.`;
        break;
      case 'identity':
        prompt = `Draft a comprehensive brand identity for: ${input.description}. Sections: 
        1. Mission 
        2. Vision 
        3. Core Values (Bullet points) 
        4. Brand Voice.`;
        break;
      case 'bio':
        prompt = `Generate 3 optimized social media bios for: ${input.description}. 
        Style 1: Minimalist. 
        Style 2: Contemporary. 
        Style 3: Professional.`;
        break;
      case 'caption':
        prompt = `Write a high-conversion social media caption for: ${input.description}. 
        Structure: Hook, Value Proposition, Call to Action. Include curated hashtags.`;
        break;
      case 'hashtags':
        prompt = `Generate 30 strategic hashtags for: ${input.description}. Categorize by: Volume, Niche, and Context.`;
        break;
      case 'marketing':
        prompt = `Draft persuasive marketing copy for: ${input.description}. 
        Focus on audience pain points and brand solution. Structure: Headline, Body, CTA.`;
        break;
      default:
        prompt = input.description;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Generation produced no content.";
  } catch (error) {
    console.error("Asset Generation Error:", error);
    throw new Error("Internal processing error. Please retry.");
  }
};

export const generateLogo = async (input: GeneratorInput): Promise<string> => {
  try {
    const styleKeywords = input.style === 'Luxury' ? 'minimalist, serif, sophisticated, elegant' :
                         input.style === 'Modern' ? 'bold, geometric, clean lines, contemporary' :
                         input.style === 'Desi' ? 'cultural motifs, vibrant, modern ethnic' :
                         'minimal, vector art, futuristic';
                         
    const prompt = `Professional visual identity design for: "${input.description}". 
    Aesthetic: ${styleKeywords}. 
    Demographic: ${input.audience}. 
    Format: Vector-style logo, white background, centered, clean composition, iconic representation.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No asset data returned from the engine.");
  } catch (error) {
    console.error("Visual Generation Error:", error);
    throw new Error("Failed to render visual asset.");
  }
};