import { copyFile, cp, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const dist = resolve(root, 'dist')
const copy = (from, to) => copyFile(resolve(root, from), resolve(dist, to))

await mkdir(resolve(dist, '_database'), { recursive: true })

await Promise.all([
  copy('.htaccess', '.htaccess'),
  copy('api.php', 'api.php'),
  copy('api-health.php', 'api-health.php'),
  copy('backend/config.example.php', 'config.local.php'),
  copy('backend/schema.sql', '_database/schema.sql'),
  // index.php, lib/*.php 與各層 .htaccess
  cp(resolve(root, 'backend/api'), resolve(dist, 'api'), { recursive: true }),
])

await writeFile(resolve(dist, 'UPLOAD_TO_CLOUDWAYS.md'), `# Cloudways deployment

Automatic deployment: push to \`main\` and GitHub Actions (.github/workflows/deploy.yml) uploads this folder.

Manual deployment:

1. Edit \`config.local.php\` and replace every placeholder with your database, Strava, and admin-secret values.
2. Import \`_database/schema.sql\` into MySQL (safe to run repeatedly). Do not upload the \`_database/\` directory to the public web root.
3. Upload every remaining file and directory in this \`dist/\` folder, including hidden \`.htaccess\` files, to:

\`/home/master/applications/nnbcjxmqpm/public_html/running-volume-competition/\`

4. Purge Cloudways Varnish after upload.
`)
