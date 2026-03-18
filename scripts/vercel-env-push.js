const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const envPath = path.join(__dirname, '../.env');

if (!fs.existsSync(envPath)) {
  console.error('Error: .env file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

for (const line of lines) {
  // Skip empty lines and comments
  if (!line || line.trim().startsWith('#') || !line.includes('=')) {
    continue;
  }

  const splitIndex = line.indexOf('=');
  const key = line.substring(0, splitIndex).trim();
  let value = line.substring(splitIndex + 1).trim();

  // Remove surrounding quotes if they exist
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.substring(1, value.length - 1);
  }

  console.log(`Pushing ${key} to Vercel...`);
  try {
    // We use echo to pass the value to vercel env add via stdin
    execSync(`echo "${value}" | npx vercel env add ${key} production`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Failed to push ${key}. It might already exist or Vercel CLI is not linked.`);
  }
}

console.log('Finished pushing environment variables!');
