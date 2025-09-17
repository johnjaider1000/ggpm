const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

import { AppConfig } from "../config/AppConfig";

export class PackageManagerDetector {


  detect(): string {
    const cwd = process.cwd();

    const packageManagerFromLockFile = this.detectFromLockFiles(cwd);
    
    return packageManagerFromLockFile ?? this.detectFromAvailableManagers();
  }

  isInstalled(packageManager: string): boolean {
    try {
      return this.checkPackageManagerVersion(packageManager);
    } catch (error) {
      return false;
    }
  }

  private checkPackageManagerVersion(packageManager: string): boolean {
    execSync(`${packageManager} --version`, { stdio: "ignore" });
    return true;
  }

  private detectFromLockFiles(cwd: string): string | null {
    const lockFileMap = AppConfig.getLockFileMap();
    
    for (const [lockFile, manager] of Object.entries(lockFileMap)) {
      const lockFilePath = path.join(cwd, lockFile);
      const lockFileExists = fs.existsSync(lockFilePath);
      
      if (lockFileExists) {
        return manager;
      }
    }
    
    return null;
  }

  private detectFromAvailableManagers(): string {
    const preferredManagers = this.getPreferredManagers();
    
    const installedManager = this.findFirstInstalledManager(preferredManagers);
    
    return installedManager ?? this.getFallbackManager();
  }

  private getPreferredManagers(): string[] {
    return AppConfig.getSupportedPackageManagers().slice(0, 2);
  }

  private findFirstInstalledManager(managers: string[]): string | null {
    for (const manager of managers) {
      const isManagerInstalled = this.isInstalled(manager);
      
      if (isManagerInstalled) {
        return manager;
      }
    }
    
    return null;
  }

  private getFallbackManager(): string {
    return "npm";
  }
}
