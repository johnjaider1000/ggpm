#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

import { PackageData, ValidationResult } from "../interfaces/IPackageValidator";
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

    // Si no hay argumentos, mostrar ayuda
    if (args.length === 0) {
      this.showHelp();
      return;
    }

    // Validar parámetros inválidos
    const invalidFlag = this.findInvalidFlag(args);
    if (invalidFlag) {
      console.error(`❌ Error: Unknown option '${invalidFlag}'`);
      console.log("\nValid options:");
      console.log("  --version, -v    Show version");
      console.log("  --help, -h       Show help");
      console.log("\nUse 'ggpm --help' for more information.");
      process.exit(1);
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

  private findInvalidFlag(args: string[]): string | null {
    const validFlags = ['--version', '-v', '--help', '-h'];
    const installCommands = AppConfig.getInstallCommands();
    
    for (const arg of args) {
      // Si empieza con - pero no es un flag válido y no es un comando de instalación
      if (arg.startsWith('-') && !validFlags.includes(arg) && !installCommands.includes(arg)) {
        return arg;
      }
    }
    
    return null;
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

    // Si no hay paquetes especificados en el comando, validar el package.json existente
    if (packages.length === 0) {
      const packageJsonPackages = this.extractPackagesFromPackageJson();
      if (packageJsonPackages.length > 0) {
        console.log("📦 No packages specified, validating existing package.json dependencies...\n");
        const result = await this.packageValidator.validatePackages(packageJsonPackages);
        return result.isValid 
          ? this.logValidationSuccess()
          : this.handleValidationFailure(result.failedPackages);
      }
      return; // No hay paquetes que validar
    }

    const result = await this.packageValidator.validatePackages(packages);
    
    return result.isValid 
      ? this.logValidationSuccess()
      : this.handleValidationFailure(result.failedPackages);
  }

  private logValidationSuccess(): void {
    console.log("\n✅ All packages are valid, proceeding with installation...\n");
  }

  private handleValidationFailure(failedPackages: any[]): never {
    console.error("\n❌ Installation blocked by packages that are too recent\n");
    this.showSuggestedVersions(failedPackages);
    process.exit(1);
  }

  private showSuggestedVersions(failedPackages: any[]): void {
    const hasSuggestions = failedPackages.length > 0;
    
    this.logSuggestionsHeader(hasSuggestions);
    this.logEachSuggestion(failedPackages);
  }

  private logSuggestionsHeader(hasSuggestions: boolean): void {
    const shouldShowHeader = hasSuggestions;
    
    this.executeConditionally(shouldShowHeader, () => {
      console.log("-".repeat(3));
      console.log("\n");
      console.log("💡 Suggested versions that meet the minimum age requirement:\n");
    });
  }

  private logEachSuggestion(failedPackages: any[]): void {
    failedPackages.forEach(pkg => this.logSingleSuggestion(pkg));
    this.showInstallationCommands(failedPackages);
    console.log("");
  }

  private logSingleSuggestion(pkg: any): void {
    const hasSuggestedVersion = Boolean(pkg.suggestedVersion);
    
    this.executeConditionally(hasSuggestedVersion, 
      () => console.log(`   ${pkg.name}: ${pkg.requestedVersion} → ${pkg.suggestedVersion}`),
      () => console.log(`   ${pkg.name}: No valid version found that meets the age requirement`)
    );
  }

  private showInstallationCommands(failedPackages: any[]): void {
    const packagesWithSuggestions = failedPackages.filter(pkg => pkg.suggestedVersion);
    
    this.executeConditionally(packagesWithSuggestions.length > 0, () => {
      console.log("\n🚀 Installation commands:");
      packagesWithSuggestions.forEach(pkg => {
        console.log(`   ggpm i ${pkg.name}@${pkg.suggestedVersion}`);
      });
    });
  }

  private executeConditionally(condition: boolean, onTrue: () => void, onFalse?: () => void): void {
    const action = condition ? onTrue : onFalse;
    action?.();
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

  private extractPackagesFromPackageJson(): PackageData[] {
    const packages: PackageData[] = [];
    
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      
      if (!fs.existsSync(packageJsonPath)) {
        return packages;
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Extraer dependencies
      if (packageJson.dependencies) {
        for (const [name, version] of Object.entries(packageJson.dependencies)) {
          packages.push({
            name,
            version: this.cleanVersionPrefix(version as string)
          });
        }
      }
      
      // Extraer devDependencies
      if (packageJson.devDependencies) {
        for (const [name, version] of Object.entries(packageJson.devDependencies)) {
          packages.push({
            name,
            version: this.cleanVersionPrefix(version as string)
          });
        }
      }
      
    } catch (error) {
      console.warn("⚠️  Could not read package.json:", (error as Error).message);
    }
    
    return packages;
  }

  private cleanVersionPrefix(version: string): string {
    // Remover prefijos comunes de versiones: ^, ~, >=, <=, >, <, =
    return version.replace(/^[\^~>=<]+/, '');
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
