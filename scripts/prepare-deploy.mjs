import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const dist = resolve(root, 'dist')
const copy = (from, to) => copyFile(resolve(root, from), resolve(dist, to))

await mkdir(resolve(dist, 'api'), { recursive: true })
await mkdir(resolve(dist, '_database'), { recursive: true })

await Promise.all([
  copy('.htaccess', '.htaccess'),
  copy('api.php', 'api.php'),
  copy('api-health.php', 'api-health.php'),
  copy('backend/api/index.php', 'api/index.php'),
  copy('backend/api/.htaccess', 'api/.htaccess'),
  copy('backend/config.example.php', 'config.local.php'),
  copy('backend/schema.sql', '_database/schema.sql'),
])

await writeFile(resolve(dist, 'UPLOAD_TO_CLOUDWAYS.md'), `# Cloudways deployment\n\n1. Edit \`config.local.php\` and replace every placeholder with your database, Strava, and admin-secret values.\n2. Import \`_database/schema.sql\` into MySQL. Do not upload the \`_database/\` directory to the public web root.\n3. Upload every remaining file and directory in this \`dist/\` folder, including hidden \`.htaccess\` files, to:\n\n\`/applications/ssehtjqyxe/public_html/running-volume-competition/\`\n\n4. Purge Cloudways Varnish after upload.\n`)
