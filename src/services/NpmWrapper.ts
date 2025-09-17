#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

import { PackageData } from "../interfaces/IPackageValidator";
import { IPackageValidator } from "../interfaces/IPackageValidator";
import { PackageValidatorFactory } from "../factories/PackageValidatorFactory";
import { AppConfig } from "../config/AppConfig";

export class NpmWrapper {
  private readonly packageValidator: IPackageValidator;
  private version: string;

  constructor(packageValidator?: IPackageValidator) {
    this.packageValidator = packageValidator || PackageValidatorFactory.create();
    this.version = this.getVersion();
  }

  private getVersion(): string {
    try {
      const packageJsonPath = path.join(__dirname, '../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.version;
    } catch (error) {
      // Fallback version if package.json can't be read
      return '1.0.3';
    }
  }

  async run(args: string[] = process.argv.slice(2)): Promise<void> {
    const commandName = path.basename(process.argv[1]);
    
    // Handle version flag directly
    if (args.includes('--version') || args.includes('-v')) {
      console.log(this.version);
      process.exit(0);
    }

    // Handle help flag
    if (args.includes('--help') || args.includes('-h')) {
      this.showHelp();
      return;
    }

    const packageManager = this.getPackageManagerFromCommand(commandName);
    const isInstallCommand = this.isInstallCommand(args);

    if (isInstallCommand) {
      console.log("🔍 Validating packages before installation...\n");
      await this.validatePackagesBeforeInstall(args);
    }

    await this.executeCommand(packageManager, args);
  }

  private showHelp(): void {
    console.log(`
GGPM - Global Guardian Package Manager v${this.version}

Usage:
  ggpm <command> [options]     Auto-detect package manager
  gnpm <command> [options]     Use npm
  gpnpm <command> [options]    Use pnpm
  gyarn <command> [options]    Use yarn
  gbun <command> [options]     Use bun

Options:
  --version, -v    Show version
  --help, -h       Show help

Examples:
  ggpm install lodash
  gnpm install express
  gpnpm add react
  gyarn add vue
  gbun install svelte

Configuration:
  Create .npmrc file with: minimum-release-age=7
`);
  }

  private getPackageManagerFromCommand(commandName: string): string {
    const commandMap: Record<string, string> = {
      "gnpm": "npm",
      "gpnpm": "pnpm", 
      "gyarn": "yarn",
      "gbun": "bun"
    };

    if (commandName === "ggpm") {
      // Auto-detect package manager
      const detector = new (require("./PackageManagerDetector").PackageManagerDetector)();
      return detector.detect();
    }

    return commandMap[commandName] || "npm";
  }

  private isInstallCommand(args: string[]): boolean {
    return args.some((arg) => AppConfig.getInstallCommands().includes(arg));
  }

  private async validatePackagesBeforeInstall(args: string[]): Promise<void> {
    const packages = this.extractPackagesFromArgs(args);

    if (packages.length > 0) {
      const isValid = await this.packageValidator.validatePackages(packages);

      if (!isValid) {
        console.error("\n❌ Installation blocked by packages that are too recent");
        process.exit(1);
      }

      console.log("\n✅ All packages are valid, proceeding with installation...\n");
    }
  }

  private extractPackagesFromArgs(args: string[]): PackageData[] {
    const packages: PackageData[] = [];
    let foundInstallCommand = false;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (AppConfig.getInstallCommands().includes(arg)) {
        foundInstallCommand = true;
        continue;
      }

      if (arg.startsWith("-")) continue;
      if (!foundInstallCommand) continue;

      const packageMatch = arg.match(/^(@?[^@]+)(?:@(.+))?$/);
      if (packageMatch) {
        const [, packageName, version] = packageMatch;
        packages.push({
          name: packageName,
          version: version || "latest",
        });
      }
    }

    return packages;
  }

  private async executeCommand(packageManager: string, args: string[]): Promise<void> {
    // Filter out wrapper commands and flags we handle internally
    const filteredArgs = args.filter(arg => 
      !['ggpm', 'gnpm', 'gpnpm', 'gyarn', 'gbun'].includes(arg) &&
      !['--version', '-v', '--help', '-h'].includes(arg)
    );
    
    // Don't execute if no valid command remains
    if (filteredArgs.length === 0) {
      return;
    }
    
    spawn(packageManager, filteredArgs, {
      stdio: "inherit",
      shell: true
    }).on("exit", (code) => {
      process.exit(code || 0);
    });
  }
}

// Función de compatibilidad para mantener la API existente
export async function runWrapper(args: string[] = process.argv.slice(2)): Promise<void> {
  const wrapper = new NpmWrapper();
  await wrapper.run(args);
}

export async function main(): Promise<void> {
  await runWrapper();
}
