// api/analyze.js  ← Coloca este archivo en la carpeta /api de tu proyecto Vercel
// Esta función serverless actúa de proxy entre tu frontend y la API de Anthropic,
// evitando el bloqueo CORS que ocurre al llamar directamente desde el navegador.
 
export default async function handler(req, res) {
  // Solo aceptamos POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }
 
  // Cabeceras CORS para que el navegador acepte la respuesta
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
 
  // Preflight OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
 
  const { base64Data, mimeType } = req.body;
 
  if (!base64Data || !mimeType) {
    return res.status(400).json({ error: "Faltan parámetros: base64Data y mimeType son obligatorios" });
  }
 
  // La API key la guardamos como variable de entorno en Vercel (nunca en el código)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key no configurada en el servidor" });
  }
 
  const prompt = `Eres un botánico y naturalista experto. Analiza esta imagen e identifica la especie que aparece (planta, animal, hongo, etc.).
 
Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta (sin texto adicional, sin bloques de código markdown):
{
  "nombre": "Nombre común en español",
  "nombreCientifico": "Nombre científico en latín",
  "tipo": "planta | animal | hongo | otro",
  "descripcion": "Descripción breve y educativa de 2-3 frases sobre la especie",
  "agua": "Descripción detallada de sus necesidades de riego",
  "luz": "Descripción detallada de sus necesidades de luz solar",
  "suelo": "Tipo de suelo ideal y composición recomendada",
  "tipoHoja": "Descripción del tipo de hoja (perenne, caduca, acicular, lanceolada, etc.) o No aplica si es animal o hongo",
  "temperatura": "Rango de temperatura óptimo y resistencia a heladas",
  "plagas": "Principales plagas y enfermedades a vigilar",
  "ecologia": "Rol ecológico e impacto en el ecosistema",
  "curiosidades": "Un dato curioso e interesante sobre esta especie",
  "confianza": "alta | media | baja"
}`;
 
  try {
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: base64Data,
                },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });
 
    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      console.error("Error de Anthropic:", errText);
      return res.status(anthropicResponse.status).json({ error: "Error en la API de Anthropic", detail: errText });
    }
 
    const data = await anthropicResponse.json();
    const text = data.content.map((b) => b.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
 
    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Error en el proxy:", err);
    return res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
}
