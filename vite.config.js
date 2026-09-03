import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin para simular as Serverless Functions /api/gerar-plano e /api/gerar-receita no ambiente de desenvolvimento Vite
function apiDevServerPlugin() {
  const handleCorsAndMethod = (req, res) => {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.statusCode = 200;
      res.end();
      return false;
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Método não permitido. Use POST.' }));
      return false;
    }

    return true;
  };

  return {
    name: 'api-dev-server-plugin',
    configureServer(server) {
      // Endpoint: /api/gerar-plano
      server.middlewares.use('/api/gerar-plano', async (req, res) => {
        if (!handleCorsAndMethod(req, res)) return;

        let bodyData = '';
        req.on('data', (chunk) => {
          bodyData += chunk;
        });

        req.on('end', async () => {
          try {
            const body = bodyData ? JSON.parse(bodyData) : {};
            const env = loadEnv('', process.cwd(), '');
            const apiKey = env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;

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

      // Endpoint: /api/gerar-receita
      server.middlewares.use('/api/gerar-receita', async (req, res) => {
        if (!handleCorsAndMethod(req, res)) return;

        let bodyData = '';
        req.on('data', (chunk) => {
          bodyData += chunk;
        });

        req.on('end', async () => {
          try {
            const body = bodyData ? JSON.parse(bodyData) : {};
            const env = loadEnv('', process.cwd(), '');
            const apiKey = env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;

            const { generateRecipeWithGemini } = await import('./api/gerar-receita.js');
            const { prato, paciente } = body;

            const receita = await generateRecipeWithGemini(prato, paciente, apiKey);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: receita }));
          } catch (err) {
            console.error('[Vite Dev API] Erro ao gerar receita:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message || 'Erro ao gerar receita com IA.' }));
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
