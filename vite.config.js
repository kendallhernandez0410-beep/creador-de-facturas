import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

// Plugin para sincronización directa con el archivo físico db.json
function dbJsonPlugin() {
  const dbPath = path.resolve(process.cwd(), 'db.json')

  const readDb = () => {
    try {
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf-8')
        return JSON.parse(raw)
      }
    } catch (e) {
      console.error('Error leyendo db.json:', e)
    }
    return { invoices: [] }
  }

  const writeDb = (data) => {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8')
      console.log('✓ db.json actualizado en disco con la nueva factura')
    } catch (e) {
      console.error('Error guardando en db.json:', e)
    }
  }

  return {
    name: 'db-json-sync-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : ''

        // GET /api/invoices -> Lee del archivo db.json en disco
        if (req.method === 'GET' && url === '/api/invoices') {
          const db = readDb()
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(JSON.stringify(db.invoices || []))
          return
        }

        // GET /api/invoices/:reference -> Busca una factura por ID o número en db.json
        if (req.method === 'GET' && url.startsWith('/api/invoices/')) {
          const reference = decodeURIComponent(url.replace('/api/invoices/', '')).trim().toLowerCase()
          const invoice = (readDb().invoices || []).find((item) =>
            String(item.id).trim().toLowerCase() === reference ||
            String(item.number).trim().toLowerCase() === reference,
          )
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = invoice ? 200 : 404
          res.end(JSON.stringify(invoice || { error: 'Factura no encontrada' }))
          return
        }

        // POST /api/invoices -> Escribe directamente en el archivo db.json en disco
        if (req.method === 'POST' && url === '/api/invoices') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const newInvoice = JSON.parse(body)
              const db = readDb()
              if (!Array.isArray(db.invoices)) {
                db.invoices = []
              }

              // Prevenir duplicados o actualizar si ya existe
              const idx = db.invoices.findIndex((inv) => String(inv.id) === String(newInvoice.id))
              if (idx >= 0) {
                db.invoices[idx] = newInvoice
              } else {
                db.invoices.unshift(newInvoice)
              }

              writeDb(db)

              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 201
              res.end(JSON.stringify(newInvoice))
            } catch (err) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Error procesando cuerpo JSON' }))
            }
          })
          return
        }

        // DELETE /api/invoices/:id -> Elimina la factura del archivo db.json
        if (req.method === 'DELETE' && url.startsWith('/api/invoices/')) {
          const id = decodeURIComponent(url.replace('/api/invoices/', ''))
          const db = readDb()
          if (Array.isArray(db.invoices)) {
            db.invoices = db.invoices.filter((inv) => String(inv.id) !== String(id))
            writeDb(db)
          }
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(JSON.stringify({ success: true, id }))
          return
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), dbJsonPlugin()],
})
