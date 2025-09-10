const fs = require('fs');
const path = require('path');

// Setup script for MCP Server Manager
console.log('Setting up MCP Server Manager...\n');

// Create necessary directories
const dirs = [
  'dist',
  'release',
  'build'
];

dirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Create a simple icon.png placeholder if it doesn't exist
const iconPath = path.join(__dirname, '..', 'public', 'icon.png');
if (!fs.existsSync(iconPath)) {
  console.log('Note: icon.png not found. Please add a 512x512 PNG icon to public/icon.png');
  console.log('You can convert the icon.svg file to PNG using any image editor or online converter.');
}

// Create entitlements file for macOS
const entitlementsPath = path.join(__dirname, '..', 'build', 'entitlements.mac.plist');
if (!fs.existsSync(entitlementsPath)) {
  const entitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
</dict>
</plist>`;
  
  fs.writeFileSync(entitlementsPath, entitlements);
  console.log('Created macOS entitlements file');
}

console.log('\nSetup complete!');
console.log('\nNext steps:');
console.log('1. Run "npm install" to install dependencies');
console.log('2. Add a 512x512 PNG icon to public/icon.png');
console.log('3. Run "npm run dev" to start development');
console.log('4. Run "npm run dist" to build the application');
