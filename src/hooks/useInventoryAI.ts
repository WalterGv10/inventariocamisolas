import { useCallback } from 'react';
import type { InventarioConDetalles } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface QueryResult {
    answer: string;
    type: 'success' | 'clarification' | 'no-data';
    debug?: any;
}

const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast?latitude=14.6349&longitude=-90.5069&current_weather=true";

/**
 * Custom hook for the AI Inventory Agent.
 * 
 * Logic to process natural language queries about the inventory without external APIs.
 * It normalizes the input, extracts entities (Teams, Colors, Sizes), filters the
 * provided inventory list, and aggregates the results.
 * 
 * NEW: Now integrates with Gemini API for general conversation if no inventory match found.
 * 
 * ---
 * 
 * Hook personalizado para el Agente de Inventario AI.
 * 
 * Lógica para procesar consultas en lenguaje natural sobre el inventario sin APIs externas.
 * Normaliza la entrada, extrae entidades (Equipos, Colores, Tallas), filtra la
 * lista de inventario proporcionada y agrega los resultados.
 * 
 * NUEVO: Ahora se integra con la API de Gemini para conversación general si no se encuentra coincidencia en el inventario.
 * 
 * @returns {Object} An object containing the `processQuery` function.
 */
export function useInventoryAI() {

    // Initialize Gemini (Conditionally)
    const geminiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;
    const model = genAI ? genAI.getGenerativeModel({ model: "gemini-pro" }) : null;

    /**
     * Helper to get current weather in Guatemala City
     */
    const getWeather = async (): Promise<string | null> => {
        try {
            const response = await fetch(WEATHER_API_URL);
            const data = await response.json();
            if (data.current_weather) {
                const temp = data.current_weather.temperature;
                return `${temp}°C en Ciudad de Guatemala`;
            }
            return null;
        } catch (e) {
            console.error("Error fetching weather", e);
            return null;
        }
    };

    /**
     * Processes a natural language query against the inventory.
     * 
     * @param {string} query - The user's input string.
     * @param {InventarioConDetalles[]} inventory - The full list of inventory items.
     * @param {string} [userName] - Optional user name for context.
     * @returns {Promise<QueryResult>} The result object containing the answer.
     */
    const processQuery = useCallback(async (query: string, inventory: InventarioConDetalles[], userName?: string): Promise<QueryResult> => {
        const text = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // --- 0. Special Case: Greetings/Weather Context ---
        const isGreeting = /(hola|buenos dias|buenas|que tal|saludos|hello)/.test(text);
        const isWeather = /(clima|tiempo|temperatura)/.test(text);

        // If explicitly asking for Gemini-like things, skip local check partially? 
        // Actually, let's try local first if it matches inventory, unless it's a greeting.

        // --- 1. Detect Intent / Entities (Local Logic) ---
        const teams: Record<string, string[]> = {
            'barcelona': ['barca', 'barça', 'barcelona', 'barsa', 'visca'],
            'real madrid': ['madrid', 'real', 'merengue', 'blanco'],
            'bayern': ['bayern', 'munich', 'bayer'],
            'milan': ['milan', 'ac milan']
        };

        const colors: Record<string, string[]> = {
            'negra': ['negra', 'black', 'oscuro'],
            'rosa': ['rosa', 'pink'],
            'amarilla': ['amarilla', 'yellow'],
            'azul': ['azul', 'blue'],
            'blanca': ['blanca', 'white'],
            'edicion especial': ['edicion', 'especial', 'limited']
        };

        const sizes = ['s', 'm', 'l', 'xl'];

        const typeMap = {
            'vendidas': ['ventas', 'vendido', 'vendieron', 'salieron', 'ganancia'],
            'muestras': ['muestra', 'muestras', 'exhibicion'],
            'stock': ['stock', 'disponible', 'hay', 'tengo', 'quedan', 'inventario']
        };

        // Extract Filter Criteria
        let matchedTeam = '';
        Object.entries(teams).forEach(([key, synonyms]) => {
            if (synonyms.some(s => text.includes(s))) matchedTeam = key;
        });

        let matchedColor = '';
        Object.entries(colors).forEach(([key, synonyms]) => {
            if (synonyms.some(s => text.includes(s))) matchedColor = key;
        });

        const matchedSize = sizes.find(s => {
            const regex = new RegExp(`\\b${s}\\b`, 'i');
            return regex.test(text);
        })?.toUpperCase() || null;

        let matchedType: 'cantidad' | 'muestras' | 'vendidas' = 'cantidad';
        let typeLabel = "en stock";

        if (typeMap.vendidas.some(s => text.includes(s))) {
            matchedType = 'vendidas';
            typeLabel = "vendidas";
        } else if (typeMap.muestras.some(s => text.includes(s))) {
            matchedType = 'muestras';
            typeLabel = "en muestra";
        }

        // --- 2. Filter Inventory (Local Logic) ---
        // Only run local logic if we found at least one criteria AND it's not just a greeting
        const hasCriteria = matchedTeam || matchedColor || matchedSize || text.includes('total');

        if (hasCriteria && !isGreeting) {
            let filtered = inventory;

            if (matchedTeam) {
                filtered = filtered.filter(i => i.equipo.toLowerCase().includes(matchedTeam.split(' ')[0]) || (matchedTeam === 'barcelona' && i.equipo.toLowerCase().includes('barc')));
            }

            if (matchedColor) {
                filtered = filtered.filter(i => i.color.toLowerCase().includes(matchedColor));
            }

            if (matchedSize) {
                filtered = filtered.filter(i => i.talla === matchedSize);
            }

            // Aggregate
            const total = filtered.reduce((acc, item) => acc + (item[matchedType] || 0), 0);

            const parts = [];
            if (matchedTeam) parts.push(matchedTeam.charAt(0).toUpperCase() + matchedTeam.slice(1));
            if (matchedColor) parts.push(matchedColor);
            if (matchedSize) parts.push(`Talla ${matchedSize}`);

            const contextStr = parts.length > 0 ? parts.join(' ') : "Total del inventario";

            return {
                answer: `Hay ${total} unidades ${typeLabel} de ${contextStr}.`,
                type: 'success',
                debug: { matchedTeam, matchedColor, matchedSize, matchedType }
            };
        }

        // --- 3. Gemini Fallback (General Conversation) ---
        // If no local match or it's a greeting, and we have an API key, ask Gemini.
        if (import.meta.env.VITE_GOOGLE_API_KEY && model) {
            try {
                // Fetch weather if likely relevant
                let weatherInfo = "";
                if (isGreeting || isWeather || text.includes('clima')) {
                    const w = await getWeather();
                    if (w) weatherInfo = `(Contexto Clima Actual: ${w})`;
                }

                const prompt = `
                    Actúa como un asistente amigable para un sistema de inventario de camisolas de fútbol llamado "Camisolas Guatemala".
                    Usuario: ${userName || 'Amigo'}
                    ${weatherInfo}
                    Pregunta del Usuario: "${query}"

                    Instrucciones:
                    - Si es un saludo, responde cálidamente usando el nombre del usuario (si lo hay) y menciona el clima si tienes el contexto.
                    - Si preguntan por el clima, responde con el dato que tienes.
                    - Si hablan de fútbol, sé casual y conocedor.
                    - Si preguntan por inventario y estás aquí, es porque el sistema local no entendió. Sugiere que pregunten por equipos específicos (Barca, Madrid) o colores.
                    - Mantén las respuestas cortas (menos de 50 palabras) y en Español.
                    - Usa emojis libremente.
                `;

                const result = await model.generateContent(prompt);
                // Depending on the version/interface, response structure might vary slightly, but this is standard.
                const response = result.response;
                const aiText = response.text();

                return {
                    answer: aiText,
                    type: 'success'
                };

            } catch (error) {
                console.error("Gemini Error:", error);
                return {
                    answer: "Lo siento, tengo problemas para pensar en este momento. Intenta preguntar por el inventario.",
                    type: 'no-data'
                };
            }
        }

        // --- 4. OpenAI Fallback (Optional) ---
        if (import.meta.env.VITE_OPENAI_API_KEY) {
            try {
                const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini", // Cost-effective model
                        messages: [
                            {
                                role: "system",
                                content: `Actúa como un asistente amigable para un sistema de inventario llamado "Camisolas Guatemala".
                                Usuario: ${userName || 'Amigo'}
                                Contexto adicional: ${isGreeting && isWeather ? await getWeather() : 'N/A'}
                                RESPONDE EN ESPAÑOL, CORTO (max 50 palabras) y amigable.`
                            },
                            { role: "user", content: query }
                        ]
                    })
                });

                const data = await openAiResponse.json();
                if (data.choices && data.choices.length > 0) {
                    return {
                        answer: data.choices[0].message.content,
                        type: 'success'
                    };
                }
            } catch (error) {
                console.error("OpenAI Error:", error);
            }
        }

        // --- 5. No Key / Fallback ---
        if (!import.meta.env.VITE_GOOGLE_API_KEY && !import.meta.env.VITE_OPENAI_API_KEY) {
            console.warn("No AI API Keys detected!");
            return {
                answer: "⚠️ No detecto ninguna API Key (Gemini u OpenAI). Configura VITE_GOOGLE_API_KEY o VITE_OPENAI_API_KEY en tu .env.local",
                type: 'clarification'
            };
        }

        return {
            answer: "Intenta preguntarme por un equipo, color o talla. Ej: 'Stock Barcelona Negra' o 'Ventas Madrid'",
            type: 'clarification'
        };

    }, [genAI, model]);

    return { processQuery };
}
