const fs = require("fs");
const path = require("path");

import { IPackageValidator, PackageData, ValidationResult, FailedPackage } from "../interfaces/IPackageValidator";
import { IPackageInfoFetcher } from "../interfaces/IPackageInfoFetcher";
import { IConfigurationReader } from "../interfaces/IConfigurationReader";
import { IPackageAgeCalculator } from "../interfaces/IPackageAgeCalculator";

export class PackageValidator implements IPackageValidator {
  constructor(
    private packageInfoFetcher: IPackageInfoFetcher,
    private configurationReader: IConfigurationReader,
    private ageCalculator: IPackageAgeCalculator
  ) {}

  async validatePackage(packageName: string, requestedVersion?: string): Promise<boolean> {
    try {
      const packageInfo = await this.packageInfoFetcher.fetchPackageInfo(packageName);
      const minimumAge = this.configurationReader.getMinimumReleaseAge();

      const isSpecificVersion = requestedVersion && requestedVersion !== "latest";
      
      return isSpecificVersion
        ? this.validateSpecificVersion(packageName, requestedVersion, packageInfo, minimumAge)
        : this.validateLatestVersion(packageName, packageInfo, minimumAge);
    } catch (error) {
      return this.handleValidationError(packageName, error as Error);
    }
  }

  private handleValidationError(packageName: string, error: Error): boolean {
    console.error(`❌ Error validating ${packageName}:`, error.message);
    return false;
  }

  async validatePackages(packages: PackageData[]): Promise<ValidationResult> {
    const failedPackages: FailedPackage[] = [];
    
    for (const pkg of packages) {
      const isValid = await this.validatePackage(pkg.name, pkg.version);
      if (!isValid) {
        const suggestedVersion = await this.findValidVersion(pkg.name, pkg.version);
        failedPackages.push({
          name: pkg.name,
          requestedVersion: pkg.version,
          suggestedVersion
        });
      }
    }

    return {
      isValid: failedPackages.length === 0,
      failedPackages
    };
  }

  async validateAllPackagesInProject(): Promise<void> {
    const packageJsonPath = this.getPackageJsonPath();
    
    const packageJsonExists = fs.existsSync(packageJsonPath);
    if (!packageJsonExists) {
      console.error("❌ package.json not found");
      process.exit(1);
    }

    const dependencies = this.extractAllDependencies(packageJsonPath);
    const minimumAge = this.configurationReader.getMinimumReleaseAge();
    
    this.logValidationStart(minimumAge);

    const allValid = await this.validateProjectDependencies(dependencies);
    
    return allValid 
      ? this.logValidationSuccess()
      : this.handleValidationFailure();
  }

  private getPackageJsonPath(): string {
    return path.join(process.cwd(), "package.json");
  }

  private extractAllDependencies(packageJsonPath: string): Record<string, string> {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    
    return {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
    };
  }

  private logValidationStart(minimumAge: number): void {
    console.log(`🔍 Validating package age (minimum: ${minimumAge} days)...\n`);
  }

  private async validateProjectDependencies(dependencies: Record<string, string>): Promise<boolean> {
    const validationPromises = Object.entries(dependencies).map(([packageName, version]) => {
      const versionToCheck = this.normalizeVersion(version);
      return this.validatePackage(packageName, versionToCheck);
    });

    const results = await Promise.all(validationPromises);
    return results.every(result => result === true);
  }

  private normalizeVersion(version: string): string {
    const cleanVersion = version.replace(/^[\^~>=<]/, "");
    return cleanVersion === version ? cleanVersion : "latest";
  }

  private logValidationSuccess(): void {
    console.log("\n✅ All packages meet the minimum age requirement");
  }

  private handleValidationFailure(): never {
    console.error("\n❌ Some packages do not meet the minimum age requirement");
    process.exit(1);
  }

  private validateSpecificVersion(
    packageName: string,
    requestedVersion: string,
    packageInfo: any,
    minimumAge: number
  ): boolean {
    const versionToCheck = this.resolveVersionToCheck(requestedVersion, packageInfo);
    const versionInfo = packageInfo.versions[versionToCheck];
    
    const versionExists = Boolean(versionInfo);
    if (!versionExists) {
      console.error(`❌ Version ${requestedVersion} not found for ${packageName}`);
      return false;
    }

    const age = this.calculatePackageAge(versionInfo, packageInfo, versionToCheck);
    
    return this.validateAge(packageName, versionToCheck, age, minimumAge);
  }

  private resolveVersionToCheck(requestedVersion: string, packageInfo: any): string {
    const majorVersion = parseInt(requestedVersion);
    const isValidMajorVersion = !isNaN(majorVersion);
    const versionExists = Boolean(packageInfo.versions[requestedVersion]);
    
    const shouldFindLatestMajorVersion = isValidMajorVersion && !versionExists;
    
    return shouldFindLatestMajorVersion
      ? this.findLatestMajorVersion(majorVersion, packageInfo)
      : requestedVersion;
  }

  private findLatestMajorVersion(majorVersion: number, packageInfo: any): string {
    const matchingVersions = this.getMatchingMajorVersions(majorVersion, packageInfo);
    const sortedVersions = this.sortVersions(matchingVersions);
    
    return sortedVersions.length > 0 
      ? sortedVersions[sortedVersions.length - 1]
      : `${majorVersion}.0.0`;
  }

  private getMatchingMajorVersions(majorVersion: number, packageInfo: any): string[] {
    return Object.keys(packageInfo.versions)
      .filter(version => version.startsWith(`${majorVersion}.`));
  }

  private sortVersions(versions: string[]): string[] {
    return versions.sort((a, b) => {
      const aParts = a.split(".").map(Number);
      const bParts = b.split(".").map(Number);

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aDiff = (aParts[i] || 0) - (bParts[i] || 0);
        if (aDiff !== 0) return aDiff;
      }
      return 0;
    });
  }

  private calculatePackageAge(versionInfo: any, packageInfo: any, version: string): number {
    const publishTime = versionInfo.time || packageInfo.time[version];
    return this.ageCalculator.calculateAge(publishTime);
  }

  private validateAge(packageName: string, version: string, age: number, minimumAge: number): boolean {
    const meetsMinimumAge = age >= minimumAge;
    
    return meetsMinimumAge
      ? this.logPackageValid(packageName)
      : this.logPackageTooRecent(packageName, version, age, minimumAge);
  }

  private logPackageValid(packageName: string): boolean {
    console.log(`✅ ${packageName} meets the minimum age requirement`);
    return true;
  }

  private logPackageTooRecent(packageName: string, version: string, age: number, minimumAge: number): boolean {
    console.error(
      `❌ ${packageName}@${version} is too recent (${age} days). Minimum required: ${minimumAge} days`
    );
    return false;
  }

  private validateLatestVersion(packageName: string, packageInfo: any, minimumAge: number): boolean {
    const latestVersion = packageInfo["dist-tags"].latest;
    const latestInfo = packageInfo.versions[latestVersion];
    const age = this.calculatePackageAge(latestInfo, packageInfo, latestVersion);

    return this.validateAge(packageName, latestVersion, age, minimumAge);
  }

  private async findValidVersion(packageName: string, requestedVersion: string): Promise<string | undefined> {
    try {
      const packageInfo = await this.packageInfoFetcher.fetchPackageInfo(packageName);
      const minimumAge = this.configurationReader.getMinimumReleaseAge();
      
      // Obtener todas las versiones ordenadas de más reciente a más antigua
      const allVersions = Object.keys(packageInfo.versions);
      const sortedVersions = this.sortVersions(allVersions).reverse();
      
      // Buscar la versión más reciente que pase el umbral
      for (const version of sortedVersions) {
        const versionInfo = packageInfo.versions[version];
        const age = this.calculatePackageAge(versionInfo, packageInfo, version);
        
        if (age >= minimumAge) {
          return version;
        }
      }
      
      return undefined;
    } catch (error) {
      return undefined;
    }
  }
}
