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
      return this.readVersionFromPackageJson();
    } catch (error) {
      return this.getFallbackVersion();
    }
  }

  private readVersionFromPackageJson(): string {
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  }

  private getFallbackVersion(): string {
    return '1.0.6';
  }

  async run(args: string[] = process.argv.slice(2)): Promise<void> {
    const commandName = path.basename(process.argv[1]);
    
    const shouldShowVersion = this.hasVersionFlag(args);
    if (shouldShowVersion) {
      console.log(this.version);
      process.exit(0);
    }

    const shouldShowHelp = this.hasHelpFlag(args);
    if (shouldShowHelp) {
      this.showHelp();
      return;
    }

    const packageManager = this.getPackageManagerFromCommand(commandName);
    const isInstallCommand = this.isInstallCommand(args);

    await this.processInstallCommand(isInstallCommand, args);
    await this.executeCommand(packageManager, args);
  }

  private hasVersionFlag(args: string[]): boolean {
    return args.includes('--version') || args.includes('-v');
  }

  private hasHelpFlag(args: string[]): boolean {
    return args.includes('--help') || args.includes('-h');
  }

  private async processInstallCommand(isInstallCommand: boolean, args: string[]): Promise<void> {
    if (!isInstallCommand) return;
    
    console.log("🔍 Validating packages before installation...\n");
    await this.validatePackagesBeforeInstall(args);
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

    return commandName === "ggpm" 
      ? this.autoDetectPackageManager()
      : commandMap[commandName] || "npm";
  }

  private autoDetectPackageManager(): string {
    const detector = new (require("./PackageManagerDetector").PackageManagerDetector)();
    return detector.detect();
  }

  private isInstallCommand(args: string[]): boolean {
    return args.some((arg) => AppConfig.getInstallCommands().includes(arg));
  }

  private async validatePackagesBeforeInstall(args: string[]): Promise<void> {
    const packages = this.extractPackagesFromArgs(args);

    const hasPackagesToValidate = packages.length > 0;
    if (!hasPackagesToValidate) return;

    const isValid = await this.packageValidator.validatePackages(packages);
    
    return isValid 
      ? this.logValidationSuccess()
      : this.handleValidationFailure();
  }

  private logValidationSuccess(): void {
    console.log("\n✅ All packages are valid, proceeding with installation...\n");
  }

  private handleValidationFailure(): never {
    console.error("\n❌ Installation blocked by packages that are too recent");
    process.exit(1);
  }

  private extractPackagesFromArgs(args: string[]): PackageData[] {
    const packages: PackageData[] = [];
    const installCommands = AppConfig.getInstallCommands();
    
    // Find the index of the install command
    const installCommandIndex = args.findIndex(arg => installCommands.includes(arg));
    
    // If no install command found, return empty array
    if (installCommandIndex === -1) {
      return packages;
    }

    // Extract packages from arguments after the install command
    for (let i = installCommandIndex + 1; i < args.length; i++) {
      const arg = args[i];
      
      // Skip flags and options
      if (arg.startsWith("-")) continue;
      
      const packageData = this.parsePackageArgument(arg);
      if (packageData) {
        packages.push(packageData);
      }
    }

    return packages;
  }

  private parsePackageArgument(arg: string): PackageData | null {
    const packageMatch = arg.match(/^(@?[^@]+)(?:@(.+))?$/);
    
    if (!packageMatch) return null;
    
    const [, packageName, version] = packageMatch;
    return {
      name: packageName,
      version: version || "latest",
    };
  }

  private async executeCommand(packageManager: string, args: string[]): Promise<void> {
    const filteredArgs = this.filterInternalArgs(args);
    
    const hasValidCommand = filteredArgs.length > 0;
    if (!hasValidCommand) return;
    
    this.spawnPackageManagerProcess(packageManager, filteredArgs);
  }

  private filterInternalArgs(args: string[]): string[] {
    const wrapperCommands = ['ggpm', 'gnpm', 'gpnpm', 'gyarn', 'gbun'];
    const internalFlags = ['--version', '-v', '--help', '-h'];
    
    return args.filter(arg => 
      !wrapperCommands.includes(arg) && !internalFlags.includes(arg)
    );
  }

  private spawnPackageManagerProcess(packageManager: string, args: string[]): void {
    spawn(packageManager, args, {
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
