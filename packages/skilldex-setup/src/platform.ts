import { homedir, platform } from 'node:os';
import { join } from 'node:path';

export type Platform = 'darwin' | 'win32' | 'linux';

export function getPlatform(): Platform {
  const p = platform();
  if (p === 'darwin' || p === 'win32' || p === 'linux') {
    return p;
  }
  throw new Error(`Unsupported platform: ${p}`);
}

export function getHome(): string {
  return homedir();
}

export function getPaths() {
  const home = getHome();
  const p = getPlatform();

  const paths = {
    // Skilldex directories
    skilldexDir: join(home, '.skilldex'),
    credentialsFile: join(home, '.skilldex', 'credentials'),

    // Linky directories
    linkyDir: join(home, '.linky'),
    nativeHostScript: join(home, '.linky', 'native-host.py'),
    tempDir: join(home, 'Desktop', 'temp'),

    // Skills directory (Claude commands)
    skillsDir: join(home, '.claude', 'commands', 'skilldex'),

    // Platform-specific paths
    shellProfile: '',
    claudeDesktopConfig: '',
    nativeHostManifestDir: '',
    nativeHostManifest: '',
  };

  switch (p) {
    case 'darwin':
      paths.shellProfile = join(home, '.zshrc');
      paths.claudeDesktopConfig = join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
      paths.nativeHostManifestDir = join(home, 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts');
      paths.nativeHostManifest = join(paths.nativeHostManifestDir, 'com.linky.link.json');
      break;

    case 'win32':
      paths.shellProfile = join(home, 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1');
      paths.claudeDesktopConfig = join(home, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
      paths.nativeHostManifestDir = join(home, '.linky');
      paths.nativeHostManifest = join(paths.nativeHostManifestDir, 'com.linky.link.json');
      break;

    case 'linux':
      paths.shellProfile = join(home, '.bashrc');
      paths.claudeDesktopConfig = join(home, '.config', 'Claude', 'claude_desktop_config.json');
      paths.nativeHostManifestDir = join(home, '.config', 'google-chrome', 'NativeMessagingHosts');
      paths.nativeHostManifest = join(paths.nativeHostManifestDir, 'com.linky.link.json');
      break;
  }

  return paths;
}

export function getKeychainCommand(action: 'add' | 'get' | 'delete', key: string): string[] | null {
  const p = getPlatform();
  const user = process.env.USER || process.env.USERNAME || 'user';

  switch (p) {
    case 'darwin':
      if (action === 'add') {
        return ['security', 'add-generic-password', '-a', user, '-s', 'SKILLDEX_API_KEY', '-w', key, '-U'];
      } else if (action === 'get') {
        return ['security', 'find-generic-password', '-a', user, '-s', 'SKILLDEX_API_KEY', '-w'];
      } else if (action === 'delete') {
        return ['security', 'delete-generic-password', '-a', user, '-s', 'SKILLDEX_API_KEY'];
      }
      break;

    case 'linux':
      if (action === 'add') {
        return ['secret-tool', 'store', '--label=Skilldex API Key', 'service', 'skilldex', 'username', user];
      } else if (action === 'get') {
        return ['secret-tool', 'lookup', 'service', 'skilldex', 'username', user];
      } else if (action === 'delete') {
        return ['secret-tool', 'clear', 'service', 'skilldex', 'username', user];
      }
      break;

    case 'win32':
      // Windows uses different approach - will handle in api-key module
      return null;
  }

  return null;
}
