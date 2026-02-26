const { execSync } = require('child_process');

try {
  console.log('Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: '/vercel/share/v0-project' });
  console.log('Prisma Client generated successfully.');
} catch (error) {
  console.error('Failed to generate Prisma Client:', error.message);
  process.exit(1);
}
