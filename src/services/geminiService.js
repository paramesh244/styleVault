import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSetting } from '../db';

let genAI = null;
let model = null;

// Priority: .env file > IndexedDB stored key
export async function getApiKey() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim() && envKey !== 'paste_your_key_here') {
    return { key: envKey.trim(), source: 'env' };
  }
  const storedKey = await getSetting('gemini_api_key');
  if (storedKey) {
    return { key: storedKey, source: 'stored' };
  }
  return { key: null, source: null };
}

async function getModel() {
  if (model) return model;
  const { key: apiKey } = await getApiKey();
  if (!apiKey) throw new Error('API key not set. Please add your Gemini API key in Settings or .env file.');
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  return model;
}

// Reset model when API key changes
export function resetModel() {
  genAI = null;
  model = null;
}

// Validate API key by making a simple request
export async function validateApiKey(apiKey) {
  try {
    const testAI = new GoogleGenerativeAI(apiKey);
    const testModel = testAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await testModel.generateContent('Say "hello" in one word.');
    const text = result.response.text();
    return text.length > 0;
  } catch (err) {
    console.error('API key validation failed:', err);
    return false;
  }
}

// ===== Phase 1: Analyze Clothing Image =====
export async function analyzeClothing(imageDataUrl) {
  const m = await getModel();

  // Extract base64 data from data URL
  const base64Data = imageDataUrl.split(',')[1];
  const mimeType = imageDataUrl.split(';')[0].split(':')[1];

  const prompt = `You are a fashion expert AI assistant. Analyze this clothing item image and return a JSON object with the following fields. Be accurate and detailed.

Return ONLY valid JSON, no markdown, no code blocks:
{
  "name": "A short descriptive name for this item (e.g., 'Navy Striped Oxford Shirt')",
  "type": "One of: tops, bottoms, dresses, outerwear, shoes, accessories",
  "subType": "Specific type (e.g., t-shirt, jeans, blazer, sneakers, watch, etc.)",
  "colors": ["Array of 1-3 main colors, use common color names"],
  "pattern": "solid, striped, plaid, floral, printed, graphic, textured, or other",
  "material": "Best guess at material (cotton, denim, leather, wool, polyester, silk, etc.)",
  "formality": "One of: very casual, casual, smart casual, business, formal",
  "seasons": ["Array from: spring, summer, fall, winter - when this item is appropriate"],
  "occasions": ["Array from: everyday, work, date, party, wedding, workout, outdoor, travel, beach"],
  "description": "A detailed 1-2 sentence description of the item including fit, style, and any notable features"
}`;

  const result = await m.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    },
  ]);

  const responseText = result.response.text();

  // Parse JSON from response, handling possible markdown wrapping
  let jsonStr = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }
  // Also try to find raw JSON
  const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    jsonStr = braceMatch[0];
  }

  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to parse AI response:', responseText);
    throw new Error('AI returned invalid format. Please try again.');
  }
}

// ===== Phase 2: Suggest Outfits =====
export async function suggestOutfits(allClothing, userRequest) {
  const m = await getModel();

  // Build a text-only description of all clothing (no images = fewer tokens)
  const wardrobeDescription = allClothing
    .map(
      (item) =>
        `[ID:${item.id}] ${item.name || 'Unnamed'} — Type: ${item.type}/${item.subType || '?'}, Colors: ${(item.colors || []).join(', ')}, Pattern: ${item.pattern || '?'}, Material: ${item.material || '?'}, Formality: ${item.formality || '?'}, Seasons: ${(item.seasons || []).join(', ')}, Occasions: ${(item.occasions || []).join(', ')}, Description: ${item.description || 'N/A'}`
    )
    .join('\n');

  const prompt = `You are a personal stylist AI. Based on the user's wardrobe below and their request, suggest 3 outfit combinations.

USER'S WARDROBE:
${wardrobeDescription}

USER'S REQUEST: "${userRequest}"

RULES:
- Each outfit should make fashion sense (color harmony, occasion-appropriate, formality match)
- An outfit needs at minimum a top + bottom, OR a dress/jumpsuit
- Optionally include outerwear, shoes, accessories if available
- Reference items by their [ID:X] number
- Give each outfit a creative name
- Explain WHY the combination works

Return ONLY valid JSON, no markdown, no code blocks:
{
  "outfits": [
    {
      "name": "Creative outfit name",
      "itemIds": [1, 5, 8],
      "reasoning": "Explanation of why these items work together and suit the occasion",
      "styleNotes": "Optional styling tip"
    }
  ],
  "generalAdvice": "Any general style advice for this occasion"
}`;

  const result = await m.generateContent(prompt);
  const responseText = result.response.text();

  let jsonStr = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }
  const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    jsonStr = braceMatch[0];
  }

  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to parse AI response:', responseText);
    throw new Error('AI returned invalid format. Please try again.');
  }
}

// ===== Follow-up Chat =====
export async function chatFollowUp(wardrobeDescription, previousSuggestions, userMessage) {
  const m = await getModel();

  const prompt = `You are a personal stylist AI. The user already received outfit suggestions and has a follow-up question.

WARDROBE CONTEXT:
${wardrobeDescription}

PREVIOUS SUGGESTIONS:
${JSON.stringify(previousSuggestions, null, 2)}

USER'S FOLLOW-UP: "${userMessage}"

Respond naturally and helpfully. If suggesting outfit changes, reference items by their name (dont mention IDs). Keep the response concise and practical. Do NOT wrap in JSON - just respond in plain text.`;

  const result = await m.generateContent(prompt);
  console.log('Chat follow-up raw response:', result);
  return result.response.text();
}
