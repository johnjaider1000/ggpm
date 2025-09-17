#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

import { PackageData } from "./interfaces/IPackageValidator";
import { IPackageValidator } from "./interfaces/IPackageValidator";
import { PackageValidatorFactory } from "./factories/PackageValidatorFactory";
import { AppConfig } from "./config/AppConfig";

export class NpmWrapper {
  private readonly packageValidator: IPackageValidator;

  constructor(packageValidator?: IPackageValidator) {
    this.packageValidator = packageValidator || PackageValidatorFactory.create();
  }

  async run(args: string[] = process.argv.slice(2)): Promise<void> {
    const command = process.argv[1];
    const isInstallCommand = this.isInstallCommand(args);

    if (isInstallCommand) {
      await this.validatePackagesBeforeInstall(args);
    }

    await this.executeCommand(command, args);
  }

  private isInstallCommand(args: string[]): boolean {
    return args.some((arg) => AppConfig.getInstallCommands().includes(arg));
  }

  private async validatePackagesBeforeInstall(args: string[]): Promise<void> {
    const packages = this.extractPackagesFromArgs(args);

    if (packages.length > 0) {
      console.log("🔍 Validating packages before installation...\n");
      
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

  private async executeCommand(command: string, args: string[]): Promise<void> {
    const packageManager = path.basename(command);
    const child = spawn(packageManager, args, {
      stdio: "inherit",
      shell: true,
    });

    child.on("exit", (code: any) => {
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

// Solo ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}
