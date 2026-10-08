import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

const OFFICIAL_ASSETS = [
  'logo.png',
  'fondomenu.png',
  'fondo juego 1.png',
  'fondo juego 2.png',
  'fondo juego 3.png',
  'personajes.png',
  'suelo.png',
  'decoracion.png',
  'Iconos de combate y potenciadores retro.png',
  'cofre.png',
  'sigueña.png'
];

function assetManagerPlugin(): Plugin {
  return {
    name: 'farm-battle-asset-manager',
    configureServer(server) {
      server.middlewares.use('/api/asset-status', (_req, res) => {
        const spritesDir = path.resolve(__dirname, 'public/assets/sprites');
        if (!fs.existsSync(spritesDir)) {
          fs.mkdirSync(spritesDir, { recursive: true });
        }
        const existing = fs.readdirSync(spritesDir);
        const status = OFFICIAL_ASSETS.map(name => ({
          name,
          present: existing.includes(name),
          size: existing.includes(name) ? fs.statSync(path.join(spritesDir, name)).size : 0
        }));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status, total: OFFICIAL_ASSETS.length, found: status.filter(s => s.present).length }));
      });

      server.middlewares.use('/api/upload-asset', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end('Method Not Allowed');
        }

        const spritesDir = path.resolve(__dirname, 'public/assets/sprites');
        if (!fs.existsSync(spritesDir)) {
          fs.mkdirSync(spritesDir, { recursive: true });
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const { fileName, base64 } = data;
            if (!fileName || !base64) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Missing fileName or base64' }));
            }

            // Remove data URI prefix if present
            const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(cleanBase64, 'base64');
            const targetPath = path.join(spritesDir, fileName);

            fs.writeFileSync(targetPath, buffer);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, fileName, size: buffer.length }));
          } catch (err: unknown) {
            res.statusCode = 500;
            const message = err instanceof Error ? err.message : 'Unknown error';
            res.end(JSON.stringify({ error: message }));
          }
        });
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), assetManagerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
