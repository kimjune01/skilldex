import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { getPaths, getPlatform, getHome } from './platform.js';

const NATIVE_HOST_SCRIPT_URL =
  'https://raw.githubusercontent.com/kimjune01/linky-browser-addon/main/chrome-extension/host/native-host.py';

const NATIVE_HOST_NAME = 'com.linky.link';

export async function downloadNativeHostScript(): Promise<boolean> {
  const paths = getPaths();

  try {
    // Create directory
    if (!existsSync(paths.linkyDir)) {
      mkdirSync(paths.linkyDir, { recursive: true });
    }

    // Download script
    const response = await fetch(NATIVE_HOST_SCRIPT_URL);
    if (!response.ok) {
      return false;
    }

    const script = await response.text();
    writeFileSync(paths.nativeHostScript, script);

    // Make executable on Unix
    if (getPlatform() !== 'win32') {
      chmodSync(paths.nativeHostScript, 0o755);
    }

    return true;
  } catch {
    return false;
  }
}

export function createTempDirectory(): boolean {
  const paths = getPaths();

  try {
    if (!existsSync(paths.tempDir)) {
      mkdirSync(paths.tempDir, { recursive: true });
    }
    return true;
  } catch {
    return false;
  }
}

export function registerNativeHost(extensionId: string): boolean {
  const paths = getPaths();
  const p = getPlatform();
  const home = getHome();

  try {
    // Create manifest directory
    if (!existsSync(paths.nativeHostManifestDir)) {
      mkdirSync(paths.nativeHostManifestDir, { recursive: true });
    }

    // Create manifest content
    const manifest = {
      name: NATIVE_HOST_NAME,
      description: 'Linky native messaging host for LinkedIn scraping',
      path: paths.nativeHostScript,
      type: 'stdio',
      allowed_origins: [`chrome-extension://${extensionId}/`],
    };

    // Write manifest
    writeFileSync(paths.nativeHostManifest, JSON.stringify(manifest, null, 2));

    // Windows requires registry entry
    if (p === 'win32') {
      try {
        execSync(
          `reg add "HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${NATIVE_HOST_NAME}" /ve /t REG_SZ /d "${paths.nativeHostManifest}" /f`,
          { stdio: 'ignore' }
        );
      } catch {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

export function getNativeHostInstructions(extensionId: string): string {
  const paths = getPaths();
  const p = getPlatform();

  const manifest = {
    name: NATIVE_HOST_NAME,
    description: 'Linky native messaging host for LinkedIn scraping',
    path: paths.nativeHostScript,
    type: 'stdio',
    allowed_origins: [`chrome-extension://${extensionId}/`],
  };

  let instructions = `
## Native Host Setup

The native messaging host has been installed at:
  ${paths.nativeHostScript}

Manifest location:
  ${paths.nativeHostManifest}

`;

  if (p === 'win32') {
    instructions += `
Registry entry created:
  HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${NATIVE_HOST_NAME}
`;
  }

  instructions += `
Manifest content:
${JSON.stringify(manifest, null, 2)}

If you need to update the extension ID later, edit:
  ${paths.nativeHostManifest}

And replace the extension ID in "allowed_origins".
`;

  return instructions;
}

export function getExtensionIdInstructions(): string {
  return `
## Finding Your Extension ID

1. Open Chrome and go to: chrome://extensions/
2. Enable "Developer mode" (toggle in top-right)
3. Load the Linky extension:
   - Click "Load unpacked"
   - Select the dist/ folder from the built extension
4. Find the extension ID (32-character string under the extension name)
5. Copy and provide this ID when prompted

Example ID format: jmfenlienpocfphpkeccphjfdoepioee
`;
}
