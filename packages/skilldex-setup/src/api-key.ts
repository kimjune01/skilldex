import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync, chmodSync } from 'node:fs';
import { dirname } from 'node:path';
import { getPlatform, getPaths, getKeychainCommand } from './platform.js';

const API_KEY_PREFIX = 'sk_live_';

export function validateApiKeyFormat(key: string): boolean {
  return key.startsWith(API_KEY_PREFIX) && key.length > API_KEY_PREFIX.length + 10;
}

export async function validateApiKeyWithServer(key: string, apiBaseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/me`, {
      headers: {
        'Authorization': `Bearer ${key}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function storeApiKeyInKeychain(key: string): boolean {
  const command = getKeychainCommand('add', key);

  if (!command) {
    // Windows - use credential manager via PowerShell
    if (getPlatform() === 'win32') {
      try {
        execSync(
          `powershell -Command "[System.Management.Automation.PSCredential]::new('SKILLDEX_API_KEY', (ConvertTo-SecureString '${key}' -AsPlainText -Force)) | Export-Clixml -Path $env:USERPROFILE\\.skilldex\\credential.xml"`,
          { stdio: 'ignore' }
        );
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  try {
    // For macOS 'add' command, key is passed as argument
    // For Linux secret-tool, key needs to be piped via stdin
    if (getPlatform() === 'linux') {
      execSync(command.join(' '), { input: key, stdio: ['pipe', 'ignore', 'ignore'] });
    } else {
      execSync(command.join(' '), { stdio: 'ignore' });
    }
    return true;
  } catch {
    return false;
  }
}

export function getApiKeyFromKeychain(): string | null {
  const command = getKeychainCommand('get', '');

  if (!command) {
    // Windows - read from credential file
    if (getPlatform() === 'win32') {
      try {
        const result = execSync(
          `powershell -Command "(Import-Clixml -Path $env:USERPROFILE\\.skilldex\\credential.xml).GetNetworkCredential().Password"`,
          { encoding: 'utf-8' }
        );
        return result.trim() || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  try {
    const result = execSync(command.join(' '), { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    return result.trim() || null;
  } catch {
    return null;
  }
}

export function storeApiKeyInFile(key: string): boolean {
  const paths = getPaths();

  try {
    // Create directory if needed
    if (!existsSync(dirname(paths.credentialsFile))) {
      mkdirSync(dirname(paths.credentialsFile), { recursive: true });
    }

    // Write credentials file with restricted permissions
    writeFileSync(paths.credentialsFile, `SKILLDEX_API_KEY=${key}\n`, { mode: 0o600 });

    if (getPlatform() !== 'win32') {
      chmodSync(paths.credentialsFile, 0o600);
    }

    return true;
  } catch {
    return false;
  }
}

export function addApiKeyToShellProfile(useKeychain: boolean): boolean {
  const paths = getPaths();
  const p = getPlatform();

  try {
    // Read existing profile
    let profile = '';
    if (existsSync(paths.shellProfile)) {
      profile = readFileSync(paths.shellProfile, 'utf-8');
    } else {
      // Create parent directory if needed
      mkdirSync(dirname(paths.shellProfile), { recursive: true });
    }

    // Check if already configured
    if (profile.includes('SKILLDEX_API_KEY')) {
      return true; // Already set up
    }

    let exportLine = '';

    if (p === 'darwin') {
      if (useKeychain) {
        exportLine = `\n# Skilldex API Key (from Keychain)\nexport SKILLDEX_API_KEY=$(security find-generic-password -a "$USER" -s "SKILLDEX_API_KEY" -w 2>/dev/null)\n`;
      } else {
        exportLine = `\n# Skilldex API Key\nsource ~/.skilldex/credentials\n`;
      }
    } else if (p === 'linux') {
      if (useKeychain) {
        exportLine = `\n# Skilldex API Key (from secret-tool)\nexport SKILLDEX_API_KEY=$(secret-tool lookup service skilldex username "$USER" 2>/dev/null)\n`;
      } else {
        exportLine = `\n# Skilldex API Key\nsource ~/.skilldex/credentials\n`;
      }
    } else if (p === 'win32') {
      // PowerShell profile
      if (useKeychain) {
        exportLine = `\n# Skilldex API Key (from Credential Manager)\n$env:SKILLDEX_API_KEY = (Import-Clixml -Path "$env:USERPROFILE\\.skilldex\\credential.xml").GetNetworkCredential().Password\n`;
      } else {
        exportLine = `\n# Skilldex API Key\n. "$env:USERPROFILE\\.skilldex\\credentials.ps1"\n`;
      }
    }

    appendFileSync(paths.shellProfile, exportLine);
    return true;
  } catch {
    return false;
  }
}
