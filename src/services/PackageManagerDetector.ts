const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

import { AppConfig } from "../config/AppConfig";

export class PackageManagerDetector {


  detect(): string {
    const cwd = process.cwd();

    // Single Responsibility: Detectar por archivos de lock
    const packageManagerFromLockFile = this.detectFromLockFiles(cwd);
    if (packageManagerFromLockFile) {
      return packageManagerFromLockFile;
    }

    // Single Responsibility: Detectar por instalación disponible
    return this.detectFromAvailableManagers();
  }

  isInstalled(packageManager: string): boolean {
    try {
      execSync(`${packageManager} --version`, { stdio: "ignore" });
      return true;
    } catch (error) {
      return false;
    }
  }

  private detectFromLockFiles(cwd: string): string | null {
    const lockFileMap = AppConfig.getLockFileMap();
    for (const [lockFile, manager] of Object.entries(lockFileMap)) {
      if (fs.existsSync(path.join(cwd, lockFile))) {
        return manager;
      }
    }
    return null;
  }

  private detectFromAvailableManagers(): string {
    // Open/Closed Principle: Fácil agregar nuevos gestores
    const preferredManagers = AppConfig.getSupportedPackageManagers().slice(0, 2); // pnpm, npm
    
    for (const manager of preferredManagers) {
      if (this.isInstalled(manager)) {
        return manager;
      }
    }

    // Fallback a npm (siempre disponible con Node.js)
    return "npm";
  }
}
