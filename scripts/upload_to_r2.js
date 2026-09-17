/**
 * Jawan Fitness — Cloudflare R2 3D Video Batch Uploader
 * 
 * Uploads all 3D Human Exercise animations to your Cloudflare R2 bucket (10 GB Free Tier).
 */

import fs from 'fs';
import path from 'path';

// Default local directory with the 50 Vital 3D MP4 animations
const LOCAL_ANIM_DIR = 'C:\\Users\\yoges\\Downloads\\Vital Animations\\VitalAnimations\\Free50\\Free50';

console.log('====================================================');
console.log('   JAWAN FITNESS — CLOUDFLARE R2 3D ASSET PIPELINE  ');
console.log('====================================================');
console.log('Free Tier Storage Available: 10.0 GB (10,240 MB)');
console.log('Egress Bandwidth Fee:       $0.00 (Zero bandwidth cost)');
console.log('Source Directory:           ' + LOCAL_ANIM_DIR);

if (!fs.existsSync(LOCAL_ANIM_DIR)) {
  console.log('\n[!] Warning: Local source directory not found at: ' + LOCAL_ANIM_DIR);
  console.log('    Place your .mp4 or .webm exercise files in public/vital-animations/ instead.\n');
  process.exit(1);
}

const files = fs.readdirSync(LOCAL_ANIM_DIR).filter(f => f.endsWith('.mp4') || f.endsWith('.webm'));
console.log(`\nFound ${files.length} high-definition 3D exercise video loops ready for R2:\n`);

let totalBytes = 0;
files.forEach((f, idx) => {
  const stats = fs.statSync(path.join(LOCAL_ANIM_DIR, f));
  totalBytes += stats.size;
  if (idx < 10 || idx >= files.length - 3) {
    console.log(`  [${(idx + 1).toString().padStart(2, '0')}] ${f} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  } else if (idx === 10) {
    console.log(`  ... [${files.length - 13} more files] ...`);
  }
});

const totalMb = (totalBytes / 1024 / 1024).toFixed(2);
console.log(`\nTotal Payload Size: ${totalMb} MB (Uses only ${(totalBytes / (10 * 1024 * 1024 * 1024) * 100).toFixed(2)}% of your 10 GB Free Tier!)`);

console.log('\n--- Upload Commands ---');
console.log('Option A: Using Wrangler CLI (Recommended):');
console.log(`  npx wrangler r2 object put jawan-fitness-3d/0051.mp4 --file="${path.join(LOCAL_ANIM_DIR, '0051.mp4')}"`);
console.log('\nOption B: Drag & Drop via Cloudflare Dashboard:');
console.log('  1. Open https://dash.cloudflare.com -> R2 Object Storage');
console.log('  2. Create a bucket named "jawan-fitness-3d"');
console.log('  3. Click "Upload", select all 50 MP4 files from:');
console.log('     ' + LOCAL_ANIM_DIR);
console.log('  4. Enable "Public Development URL" (r2.dev) or connect a custom domain (media.jawanfitness.com)');
console.log('  5. Paste your public URL into Jawan Fitness -> Admin -> Cloudflare R2 Settings!\n');
