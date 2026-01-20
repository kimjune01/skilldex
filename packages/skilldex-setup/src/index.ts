#!/usr/bin/env node

import { input, confirm, select } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';

import { getPlatform, getPaths } from './platform.js';
import {
  validateApiKeyFormat,
  validateApiKeyWithServer,
  storeApiKeyInKeychain,
  storeApiKeyInFile,
  addApiKeyToShellProfile,
} from './api-key.js';
import {
  checkUvInstalled,
  checkPythonInstalled,
  installLinkyMcp,
  updateClaudeDesktopConfig,
  getClaudeCodeMcpConfig,
} from './mcp-config.js';
import {
  downloadNativeHostScript,
  createTempDirectory,
  registerNativeHost,
  getExtensionIdInstructions,
} from './native-host.js';
import { fetchAvailableSkills, installSkills, getBundledSkills, getSkillsDirectory } from './skills.js';

const DEFAULT_API_URL = 'http://localhost:3000';

async function main() {
  console.log(chalk.bold.cyan('\n  Skilldex Setup\n'));
  console.log(chalk.gray(`  Platform: ${getPlatform()}`));
  console.log(chalk.gray(`  Skills will be installed to: ${getSkillsDirectory()}\n`));

  // Step 1: Get API URL
  const apiUrl = await input({
    message: 'Skilldex API URL:',
    default: DEFAULT_API_URL,
  });

  // Step 2: Get and validate API key
  console.log(chalk.yellow('\n  Get your API key from: ') + chalk.underline(`${apiUrl}/keys\n`));

  const apiKey = await input({
    message: 'Enter your API key (sk_live_...):',
    validate: (value) => {
      if (!validateApiKeyFormat(value)) {
        return 'Invalid API key format. Should start with sk_live_';
      }
      return true;
    },
  });

  // Validate with server
  const validationSpinner = ora('Validating API key...').start();
  const isValid = await validateApiKeyWithServer(apiKey, apiUrl);

  if (!isValid) {
    validationSpinner.fail('API key validation failed. Check your key and try again.');
    process.exit(1);
  }
  validationSpinner.succeed('API key validated');

  // Step 3: Store API key
  const storageMethod = await select({
    message: 'How would you like to store the API key?',
    choices: [
      {
        name: getPlatform() === 'darwin' ? 'macOS Keychain (recommended)' : 'System credential store (recommended)',
        value: 'keychain',
      },
      { name: 'Credentials file (~/.skilldex/credentials)', value: 'file' },
    ],
  });

  const keySpinner = ora('Storing API key...').start();
  let keyStored = false;
  let useKeychain = false;

  if (storageMethod === 'keychain') {
    keyStored = storeApiKeyInKeychain(apiKey);
    useKeychain = keyStored;
    if (!keyStored) {
      keySpinner.warn('Could not store in keychain, falling back to file');
      keyStored = storeApiKeyInFile(apiKey);
    }
  } else {
    keyStored = storeApiKeyInFile(apiKey);
  }

  if (!keyStored) {
    keySpinner.fail('Failed to store API key');
    process.exit(1);
  }

  // Add to shell profile
  const profileUpdated = addApiKeyToShellProfile(useKeychain);
  if (profileUpdated) {
    keySpinner.succeed(`API key stored${useKeychain ? ' in keychain' : ''} and shell profile updated`);
  } else {
    keySpinner.warn('API key stored but could not update shell profile');
  }

  // Step 4: Ask about LinkedIn features
  const installLinky = await confirm({
    message: 'Install Linky for LinkedIn scraping? (Requires browser extension)',
    default: true,
  });

  let mcpMethod: 'uvx' | 'uv' | 'pipx' | 'pip' | 'python' = 'uvx';

  if (installLinky) {
    // Check prerequisites
    console.log(chalk.gray('\n  Checking prerequisites...\n'));

    const hasUv = checkUvInstalled();
    const hasPython = checkPythonInstalled();

    if (!hasUv && !hasPython) {
      console.log(chalk.yellow('  Neither uv nor Python found.'));
      console.log(chalk.yellow('  Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh'));
      console.log(chalk.yellow('  Or install Python: https://python.org\n'));

      const skipLinky = await confirm({
        message: 'Skip Linky installation? (You can install manually later)',
        default: true,
      });

      if (skipLinky) {
        console.log(chalk.gray('  Skipping Linky installation.\n'));
      }
    } else {
      // Install Linky MCP
      const linkySpinner = ora('Installing Linky MCP server...').start();
      const result = installLinkyMcp();

      if (result.success) {
        linkySpinner.succeed(`Linky MCP installed via ${result.method}`);
        mcpMethod = result.method as typeof mcpMethod;

        // Update Claude Desktop config
        const configSpinner = ora('Configuring Claude Desktop...').start();
        const configUpdated = updateClaudeDesktopConfig(mcpMethod);

        if (configUpdated) {
          configSpinner.succeed('Claude Desktop config updated');
        } else {
          configSpinner.warn('Could not update Claude Desktop config');
          console.log(chalk.gray('\n  Add this to your Claude Desktop config manually:\n'));
          console.log(chalk.gray(getClaudeCodeMcpConfig(mcpMethod)));
        }

        // Download native host
        const nativeSpinner = ora('Installing native messaging host...').start();
        const nativeDownloaded = await downloadNativeHostScript();
        const tempCreated = createTempDirectory();

        if (nativeDownloaded && tempCreated) {
          nativeSpinner.succeed('Native host installed');

          // Ask for extension ID
          console.log(chalk.yellow(getExtensionIdInstructions()));

          const hasExtension = await confirm({
            message: 'Do you have the Linky browser extension installed?',
            default: false,
          });

          if (hasExtension) {
            const extensionId = await input({
              message: 'Enter the extension ID:',
              validate: (value) => {
                if (!/^[a-z]{32}$/.test(value)) {
                  return 'Extension ID should be 32 lowercase letters';
                }
                return true;
              },
            });

            const registerSpinner = ora('Registering native host...').start();
            const registered = registerNativeHost(extensionId);

            if (registered) {
              registerSpinner.succeed('Native host registered with Chrome');
            } else {
              registerSpinner.fail('Failed to register native host');
            }
          } else {
            console.log(chalk.yellow('\n  To complete Linky setup later:'));
            console.log(chalk.gray('  1. Install the browser extension'));
            console.log(chalk.gray('  2. Run: npx skilldex-setup --register-extension\n'));
          }
        } else {
          nativeSpinner.fail('Failed to install native host');
        }
      } else {
        linkySpinner.fail(`Failed to install Linky: ${result.error}`);
      }
    }
  }

  // Step 5: Download skills
  console.log(chalk.cyan('\n  Installing skills...\n'));

  const skillsSpinner = ora('Fetching skills from Skilldex...').start();
  let skills = await fetchAvailableSkills(apiUrl, apiKey);

  if (skills.length === 0) {
    skillsSpinner.warn('Could not fetch skills from server, using bundled skills');
    skills = getBundledSkills();
  }

  const { installed, failed } = installSkills(skills);
  skillsSpinner.succeed(`Installed ${installed.length} skills`);

  if (failed.length > 0) {
    console.log(chalk.yellow(`  Failed to install: ${failed.join(', ')}`));
  }

  // Summary
  console.log(chalk.bold.green('\n  Setup Complete!\n'));

  console.log(chalk.white('  Next steps:\n'));
  console.log(chalk.gray('  1. Restart your terminal to load the API key'));
  console.log(chalk.gray('  2. Restart Claude Desktop to load MCP config'));

  if (installLinky) {
    console.log(chalk.gray('  3. Install Linky browser extension if not done:'));
    console.log(chalk.gray('     git clone https://github.com/kimjune01/linky-browser-addon'));
    console.log(chalk.gray('     cd linky-browser-addon && pnpm install && pnpm build'));
    console.log(chalk.gray('     Load dist/ folder in chrome://extensions/'));
  }

  console.log(chalk.gray(`\n  4. Run ${chalk.cyan('/skilldex-health-check')} in Claude to verify\n`));

  // Show paths for reference
  const paths = getPaths();
  console.log(chalk.gray('  Installed locations:'));
  console.log(chalk.gray(`    Skills: ${paths.skillsDir}`));
  console.log(chalk.gray(`    Credentials: ${paths.credentialsFile}`));
  if (installLinky) {
    console.log(chalk.gray(`    Native host: ${paths.nativeHostScript}`));
    console.log(chalk.gray(`    Temp dir: ${paths.tempDir}`));
  }
  console.log();
}

main().catch((error) => {
  console.error(chalk.red('\nSetup failed:'), error.message);
  process.exit(1);
});
