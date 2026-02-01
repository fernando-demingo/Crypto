
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis, MarketStats, PricePoint, PredictedProfitCoin } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const getMarketAnalysis = async (
  stats: MarketStats,
  history: PricePoint[]
): Promise<AIAnalysis | null> => {
  try {
    const recentHistory = history.slice(-60);
    const historyContext = recentHistory
      .map(p => `{"t": ${p.time}, "p": ${p.price.toFixed(4)}}`)
      .join('\n');

    const prompt = `
      Act as a professional crypto financial analyst. Analyze the following ${stats.name} (${stats.symbol.toUpperCase()}) market data.
      
      Current Stats:
      - Asset: ${stats.name}
      - Current Price: $${stats.currentPrice}
      - 24h Change: ${stats.change24h.toFixed(2)}%
      
      Price Trend Context (JSON lines of timestamp 't' and price 'p'):
      ${historyContext}

      Tasks:
      1. Provide a current trade recommendation for a 12h horizon.
      2. Identify 3-5 "historical signals" from the PROVIDED data where a clear BUY or SELL entry/exit occurred in the last 24 hours. Use the exact timestamps from the data provided.
      
      Provide your analysis in JSON format exactly as defined in the schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: {
              type: Type.STRING,
              description: "The trade recommendation (STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL)",
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence level between 0 and 100",
            },
            rationale: {
              type: Type.STRING,
              description: "Detailed explanation of why this recommendation was given",
            },
            shortTermOutlook: {
              type: Type.STRING,
              description: "Brief prediction for the next 12-24 hours",
            },
            riskLevel: {
              type: Type.STRING,
              description: "Assessment of current market volatility risk",
            },
            historicalSignals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.NUMBER, description: "The exact timestamp from the input data" },
                  type: { type: Type.STRING, description: "BUY or SELL" },
                  price: { type: Type.NUMBER, description: "The price at that timestamp" }
                },
                required: ["time", "type", "price"]
              }
            }
          },
          required: ["recommendation", "confidence", "rationale", "shortTermOutlook", "riskLevel", "historicalSignals"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return {
      ...result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return null;
  }
};

export const getFutureProfitPredictions = async (coins: any[]): Promise<PredictedProfitCoin[]> => {
  try {
    const coinContext = coins.map(c => `${c.name} (${c.symbol.toUpperCase()}): 24h change ${c.change24h.toFixed(2)}%`).join(', ');
    
    const prompt = `
      Based on the following list of cryptocurrencies, identify the 30 assets with the HIGHEST profit potential in the next 12 hours.
      Market Data: ${coinContext}
      
      For each selected asset, provide:
      - Predicted move (%)
      - Risk Score (1-10, where 10 is most risky)
      - A short one-sentence rationale.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              symbol: { type: Type.STRING },
              name: { type: Type.STRING },
              predictedMove: { type: Type.NUMBER, description: "Expected % change in next 12h" },
              riskScore: { type: Type.NUMBER, description: "1-10 risk rating" },
              rationale: { type: Type.STRING, description: "Short reasoning" }
            },
            required: ["id", "symbol", "name", "predictedMove", "riskScore", "rationale"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Future Prediction failed:", error);
    return [];
  }
};
