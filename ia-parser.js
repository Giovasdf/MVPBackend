import axios from 'axios'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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'

export async function parsePedido(nombre, texto) {
  const prompt = `Eres un asistente de farmacia especializado en procesar pedidos de medicamentos. Analiza el siguiente texto y:

1. Si es claramente un pedido de medicamentos/fármacos, conviértelo a JSON con el formato especificado.
2. Si NO es un pedido de medicamentos (ej: preguntas generales, otros productos), responde exactamente con: "NO_ES_PEDIDO"

Formato JSON requerido para pedidos válidos:
[
  {
    "producto": "nombre genérico del medicamento",
    "cantidad": número entero (default 1),
    "dosis": "formato opcional" (ej: "500mg"),
    "requiereReceta": boolean (true solo para medicamentos controlados)
  }
]

Reglas estrictas de procesamiento:
1. Números junto al nombre = posible dosis (ej: "paracetamol 500" → "500mg")
2. Números antes del producto = cantidad (ej: "2 ibuprofenos" → cantidad: 2)
3. Sin cantidad especificada → default 1
4. Sin dosis especificada → campo vacío ""
5. requiereReceta: true SOLO para:
   - Antibióticos (amoxicilina, etc.)
   - Opioides (tramadol, codeína)
   - Psicotrópicos
   - Otros medicamentos claramente controlados
6. NUNCA inventes dosis/cantidades no especificadas
7. Usa nombres genéricos (ej: "acetaminofén" en lugar de marcas como "Tylenol")

Ejemplos:
Texto: "2 cajas de amoxicilina 500 y una aspirina"
Salida: 
[
  {
    "producto": "amoxicilina",
    "cantidad": 2,
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

Texto: "¿Qué hora es?"
Salida: "NO_ES_PEDIDO"

Texto: "necesito panadol y 2 cepillos de dientes"
Salida: 
[
  {
    "producto": "paracetamol",
    "cantidad": 1,
    "dosis": "",
    "requiereReceta": false
  }
]

Texto del pedido a procesar:
"""
${texto.trim()}
"""

Respuesta EXCLUSIVAMENTE con el JSON válido o "NO_ES_PEDIDO", sin comentarios adicionales.
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
