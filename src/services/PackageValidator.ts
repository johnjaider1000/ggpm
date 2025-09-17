const fs = require("fs");
const path = require("path");

import { IPackageValidator, PackageData } from "../interfaces/IPackageValidator";
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

      if (requestedVersion && requestedVersion !== "latest") {
        return this.validateSpecificVersion(packageName, requestedVersion, packageInfo, minimumAge);
      } else {
        return this.validateLatestVersion(packageName, packageInfo, minimumAge);
      }
    } catch (error) {
      console.error(`❌ Error validating ${packageName}:`, (error as Error).message);
      return false;
    }
  }

  async validatePackages(packages: PackageData[]): Promise<boolean> {
    console.log("🔍 Validating packages before installation...\n");

    let allValid = true;

    for (const pkg of packages) {
      const isValid = await this.validatePackage(pkg.name, pkg.version);
      if (!isValid) {
        allValid = false;
      }
    }

    return allValid;
  }

  async validateAllPackagesInProject(): Promise<void> {
    const packageJsonPath = path.join(process.cwd(), "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      console.error("❌ package.json not found");
      process.exit(1);
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
    };

    const minimumAge = this.configurationReader.getMinimumReleaseAge();
    console.log(`🔍 Validating package age (minimum: ${minimumAge} days)...\n`);

    let allValid = true;

    for (const [packageName, version] of Object.entries(dependencies)) {
      const cleanVersion = (version as string).replace(/^[\^~>=<]/, "");
      const versionToCheck = cleanVersion === version ? cleanVersion : "latest";
      const isValid = await this.validatePackage(packageName, versionToCheck);

      if (!isValid) {
        allValid = false;
      }
    }

    if (!allValid) {
      console.error("\n❌ Some packages do not meet the minimum age requirement");
      process.exit(1);
    }

    console.log("\n✅ All packages meet the minimum age requirement");
  }

  private validateSpecificVersion(
    packageName: string,
    requestedVersion: string,
    packageInfo: any,
    minimumAge: number
  ): boolean {
    const majorVersion = parseInt(requestedVersion);
    let versionToCheck = requestedVersion;

    if (!isNaN(majorVersion) && !packageInfo.versions[requestedVersion]) {
      const matchingVersions = Object.keys(packageInfo.versions)
        .filter((version) => version.startsWith(`${majorVersion}.`))
        .sort((a, b) => {
          const aParts = a.split(".").map(Number);
          const bParts = b.split(".").map(Number);

          for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aDiff = (aParts[i] || 0) - (bParts[i] || 0);
            if (aDiff !== 0) return aDiff;
          }
          return 0;
        });

      if (matchingVersions.length > 0) {
        versionToCheck = matchingVersions[matchingVersions.length - 1];
      }
    }

    const versionInfo = packageInfo.versions[versionToCheck];
    if (!versionInfo) {
      console.error(`❌ Version ${requestedVersion} not found for ${packageName}`);
      return false;
    }

    const age = this.ageCalculator.calculateAge(
      versionInfo.time || packageInfo.time[versionToCheck]
    );

    if (age < minimumAge) {
      console.error(
        `❌ ${packageName}@${versionToCheck} is too recent (${age} days). Minimum required: ${minimumAge} days`
      );
      return false;
    }

    console.log(`✅ ${packageName} meets the minimum age requirement`);
    return true;
  }

  private validateLatestVersion(packageName: string, packageInfo: any, minimumAge: number): boolean {
    const latestVersion = packageInfo["dist-tags"].latest;
    const latestInfo = packageInfo.versions[latestVersion];
    const age = this.ageCalculator.calculateAge(
      latestInfo.time || packageInfo.time[latestVersion]
    );

    if (age < minimumAge) {
      console.error(
        `❌ ${packageName}@${latestVersion} is too recent (${age} days). Minimum required: ${minimumAge} days`
      );
      return false;
    }

    console.log(`✅ ${packageName} meets the minimum age requirement`);
    return true;
  }
}
