import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const SOURCE_DIR = 'C:\\Users\\yoges\\Downloads\\Vital Animations\\VitalAnimations\\Free50\\Free50';
const TEMP_DEPLOY_DIR = 'C:\\Users\\yoges\\.gemini\\antigravity-ide\\scratch\\vital-deploy';

// Ensure clean deploy directory without spaces in path
if (!fs.existsSync(TEMP_DEPLOY_DIR)) {
  fs.mkdirSync(TEMP_DEPLOY_DIR, { recursive: true });
}

// Copy the 50 files if not already copied
const sourceFiles = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.mp4') || f.endsWith('.webm'));
console.log(`Found ${sourceFiles.length} files in source directory.`);

for (const file of sourceFiles) {
  const src = path.join(SOURCE_DIR, file);
  const dest = path.join(TEMP_DEPLOY_DIR, file);
  if (!fs.existsSync(dest) || fs.statSync(dest).size !== fs.statSync(src).size) {
    fs.copyFileSync(src, dest);
  }
}

// Add an index.html so Pages serves cleanly
fs.writeFileSync(path.join(TEMP_DEPLOY_DIR, 'index.html'), `<!DOCTYPE html>
<html>
<head><title>Jawan Fitness 3D Media CDN</title></head>
<body style="background:#04060a;color:#f59e0b;font-family:sans-serif;text-align:center;padding:50px;">
  <h1>Jawan Fitness 3D Exercise Media Host</h1>
  <p>Status: Active & Serving 50 3D Human Exercise Loops.</p>
</body>
</html>`);

// Also add _headers file for CORS and cache control
fs.writeFileSync(path.join(TEMP_DEPLOY_DIR, '_headers'), `/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, HEAD, OPTIONS
  Cache-Control: public, max-age=31536000, immutable
`);

console.log('Deploy directory prepared with 50 MP4s and headers at:', TEMP_DEPLOY_DIR);
console.log('Deploying to Cloudflare Pages project: jawan-fitness-media...');

// Credentials come from environment — never hardcode Cloudflare keys.
if (!process.env.CLOUDFLARE_API_KEY) {
  console.error('CLOUDFLARE_API_KEY is not set. Export your Cloudflare API token and retry.');
  process.exit(1);
}

const env = { ...process.env };

const child = spawn('npx', ['wrangler', 'pages', 'deploy', TEMP_DEPLOY_DIR, '--project-name=jawan-fitness-media', '--branch=main'], {
  env,
  shell: true
});

child.stdout.on('data', d => process.stdout.write(d.toString()));
child.stderr.on('data', d => process.stderr.write(d.toString()));
child.on('close', code => {
  console.log('\nDeployment process exited with code:', code);
  if (code === 0) {
    console.log('\n🎉 SUCCESS! Your 3D human exercise videos are LIVE on:');
    console.log('👉 https://jawan-fitness-media.pages.dev/0051.mp4');
  }
});
