import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, 'xp_sets.json');

function localDatabasePlugin() {
  const handleApiRequest = (req, res, next) => {
    const url = req.url.split('?')[0];

    if (url === '/api/db') {
      const origin = req.headers.origin || '*';
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Origin, Accept, X-Requested-With');
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        return res.end();
      }

      if (req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        try {
          if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf-8');
            res.statusCode = 200;
            return res.end(data);
          } else {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: 'Database file not found: ' + DB_FILE }));
          }
        } catch (err) {
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: err.message }));
        }
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            const formatted = JSON.stringify(parsed, null, 2);
            fs.writeFileSync(DB_FILE, formatted, 'utf-8');
            try {
              const distFile = path.resolve(__dirname, 'dist', 'xp_sets.json');
              if (fs.existsSync(path.dirname(distFile))) {
                fs.writeFileSync(distFile, formatted, 'utf-8');
              }
            } catch (e) {}
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.statusCode = 200;
            return res.end(JSON.stringify({
              success: true,
              file: 'xp_sets.json',
              timestamp: new Date().toISOString()
            }));
          } catch (err) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }
    }

    if (url === '/xp_sets.json' && req.method === 'GET') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      if (fs.existsSync(DB_FILE)) {
        res.statusCode = 200;
        return res.end(fs.readFileSync(DB_FILE, 'utf-8'));
      }
    }

    next();
  };

  return {
    name: 'local-database-api',
    configureServer(server) {
      server.middlewares.use(handleApiRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleApiRequest);
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(
          /<script\s+src=["']\/?(js\/[^"']+|app\.js)["']><\/script>/gi,
          '<script type="module" src="/$1"></script>'
        );
      }
    },
    closeBundle() {
      // Sincronizar xp_sets.json y la carpeta mobs/ en dist/ para previsualización estática
      try {
        const distDir = path.resolve(__dirname, 'dist');
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }
        if (fs.existsSync(DB_FILE)) {
          fs.copyFileSync(DB_FILE, path.resolve(distDir, 'xp_sets.json'));
        }
        const mobsSrc = path.resolve(__dirname, 'mobs');
        const mobsDist = path.resolve(distDir, 'mobs');
        if (fs.existsSync(mobsSrc)) {
          fs.cpSync(mobsSrc, mobsDist, { recursive: true });
        }
      } catch (err) {
        console.warn('Could not copy assets to dist directory:', err.message);
      }
    }
  };
}

export default defineConfig({
  plugins: [localDatabasePlugin()],
  server: {
    cors: false,
    watch: {
      ignored: ['**/xp_sets.json', '**/dofus_xp_*.json']
    }
  }
});

