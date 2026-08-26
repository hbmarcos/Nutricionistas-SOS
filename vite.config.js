import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin para simular a Serverless Function /api/gerar-plano no ambiente de desenvolvimento Vite
function apiDevServerPlugin() {
  return {
    name: 'api-dev-server-plugin',
    configureServer(server) {
      server.middlewares.use('/api/gerar-plano', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Método não permitido. Use POST.' }));
          return;
        }

        let bodyData = '';
        req.on('data', (chunk) => {
          bodyData += chunk;
        });

        req.on('end', async () => {
          try {
            const body = bodyData ? JSON.parse(bodyData) : {};
            const env = loadEnv('', process.cwd(), '');
            const apiKey = env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;

            // Import dinâmico da função geradora de plano
            const { generateMealPlanWithGemini } = await import('./api/gerar-plano.js');
            const paciente = body?.paciente || body;

            const plano = await generateMealPlanWithGemini(paciente, apiKey);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: plano }));
          } catch (err) {
            console.error('[Vite Dev API] Erro ao gerar plano:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message || 'Erro ao processar plano com IA.' }));
          }
        });
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiDevServerPlugin()],
});
