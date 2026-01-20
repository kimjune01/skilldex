import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { getPaths, getPlatform } from './platform.js';

interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

interface ClaudeDesktopConfig {
  mcpServers?: Record<string, MCPServerConfig>;
  [key: string]: unknown;
}

export function checkUvInstalled(): boolean {
  try {
    execSync('uv --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function checkPythonInstalled(): boolean {
  try {
    execSync('python3 --version', { stdio: 'ignore' });
    return true;
  } catch {
    try {
      execSync('python --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

export function installLinkyMcp(): { success: boolean; method: string; error?: string } {
  // Try uv first (preferred)
  if (checkUvInstalled()) {
    try {
      execSync('uv tool install linky', { stdio: 'inherit' });
      return { success: true, method: 'uv' };
    } catch (e) {
      // uv might fail if already installed or package not found
      // Try uvx directly
      try {
        execSync('uvx linky --help', { stdio: 'ignore' });
        return { success: true, method: 'uvx' };
      } catch {
        // Continue to pip fallback
      }
    }
  }

  // Try pipx
  try {
    execSync('pipx --version', { stdio: 'ignore' });
    execSync('pipx install linky', { stdio: 'inherit' });
    return { success: true, method: 'pipx' };
  } catch {
    // Continue to pip fallback
  }

  // Try pip
  if (checkPythonInstalled()) {
    try {
      execSync('pip install linky', { stdio: 'inherit' });
      return { success: true, method: 'pip' };
    } catch (e) {
      return { success: false, method: 'pip', error: String(e) };
    }
  }

  return { success: false, method: 'none', error: 'No Python package manager found (uv, pipx, or pip)' };
}

export function updateClaudeDesktopConfig(method: 'uvx' | 'uv' | 'pipx' | 'pip' | 'python'): boolean {
  const paths = getPaths();

  try {
    // Read existing config or create new
    let config: ClaudeDesktopConfig = {};

    if (existsSync(paths.claudeDesktopConfig)) {
      const content = readFileSync(paths.claudeDesktopConfig, 'utf-8');
      config = JSON.parse(content);
    } else {
      // Create directory if needed
      mkdirSync(dirname(paths.claudeDesktopConfig), { recursive: true });
    }

    // Ensure mcpServers object exists
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    // Determine command based on installation method
    let serverConfig: MCPServerConfig;

    switch (method) {
      case 'uvx':
      case 'uv':
        serverConfig = {
          command: 'uvx',
          args: ['linky'],
        };
        break;
      case 'pipx':
        serverConfig = {
          command: 'linky',
        };
        break;
      case 'pip':
      case 'python':
        serverConfig = {
          command: getPlatform() === 'win32' ? 'python' : 'python3',
          args: ['-m', 'linky'],
        };
        break;
      default:
        serverConfig = {
          command: 'uvx',
          args: ['linky'],
        };
    }

    // Add or update linky server config
    config.mcpServers['linky'] = serverConfig;

    // Write updated config
    writeFileSync(paths.claudeDesktopConfig, JSON.stringify(config, null, 2));

    return true;
  } catch {
    return false;
  }
}

export function getClaudeCodeMcpConfig(method: 'uvx' | 'uv' | 'pipx' | 'pip' | 'python'): string {
  let command: string;
  let args: string[] = [];

  switch (method) {
    case 'uvx':
    case 'uv':
      command = 'uvx';
      args = ['linky'];
      break;
    case 'pipx':
      command = 'linky';
      break;
    case 'pip':
    case 'python':
      command = getPlatform() === 'win32' ? 'python' : 'python3';
      args = ['-m', 'linky'];
      break;
    default:
      command = 'uvx';
      args = ['linky'];
  }

  const config = {
    mcpServers: {
      linky: {
        command,
        ...(args.length > 0 && { args }),
      },
    },
  };

  return JSON.stringify(config, null, 2);
}
