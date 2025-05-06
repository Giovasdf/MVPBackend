// vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node', // necesario para backend puro
    globals: true,        // Para usar describe, it sin importar
    coverage: {
      reporter: ['text', 'json', 'html'], // cobertura opcional
    },
    testTimeout: 10000, // tiempo de espera para cada test
    reporters: [
      'default',                      // Reporte en terminal
      ['junit', { suiteName: 'MediBot Tests' }],  // Reporte en XML
      'json',                         // Reporte en JSON
    ],
    outputFile: {
      junit: './reports/report.xml',
      json: './reports/report.json',
    }
  },
})
