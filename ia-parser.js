import axios from 'axios'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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'

export async function parsePedido(nombre, texto) {
  const prompt = `
Eres un asistente de farmacia que recibe pedidos escritos informalmente. Convierte el siguiente texto en un JSON válido con el siguiente formato:

[
  {
    "producto": "nombre del producto",
    "cantidad": número entero (por defecto 1),
    "dosis": "formato opcional" (ej. "500mg", "10ml"),
    "requiereReceta": boolean (true si es controlado o necesita receta médica)
  }
]

Instrucciones:
- Si un número aparece junto al nombre del producto (como "panadol 300"), asume que puede ser una dosis (por ejemplo, 300mg), NO la cantidad.
- Si el número representa claramente una cantidad (ej: "2 cajas de paracetamol"), úsalo como 'cantidad'.
- Si no se especifica una cantidad, asume 1.
- No inventes dosis ni cantidades si no están presentes.
- Usa nombres genéricos de medicamentos si es posible.
- Usa 'requiereReceta: true' solo si el producto es comúnmente controlado o requiere receta en farmacias.

Ejemplo:
Texto: "quiero 1 caja de amoxicilina 500mg y aspirina"
Resultado:
[
  {
    "producto": "amoxicilina",
    "cantidad": 1,
    "dosis": "500mg",
    "requiereReceta": true
  },
  {
    "producto": "aspirina",
    "cantidad": 1,
    "dosis": "",
    "requiereReceta": false
  }
]

Texto del pedido:
"""
${texto.trim()}
"""

Devuelve SOLO el JSON, sin explicaciones ni comentarios.
`
;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )

    const contenido = response.data.choices[0]?.message?.content
    if (!contenido) throw new Error('No se recibió respuesta de la IA')

    const jsonStr = contenido
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    console.log('Respuesta de la IA:', jsonStr)

    const productos = JSON.parse(jsonStr)

    if (!Array.isArray(productos)) {
      throw new Error('La respuesta no es un array')
    }

    for (const item of productos) {
      if (!item.producto || typeof item.producto !== 'string') {
        throw new Error('Estructura de producto inválida')
      }
    }

    return { nombre, productos }

  } catch (err) {
    console.error('Error en parsePedido:', err)
    throw new Error('No pude procesar el pedido. Por favor, especifica los productos más claramente.')
  }
}
