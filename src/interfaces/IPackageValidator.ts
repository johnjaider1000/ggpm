export interface PackageData {
  name: string;
  version: string;
}

export interface IPackageValidator {
  validatePackage(packageName: string, requestedVersion?: string): Promise<boolean>;
  validatePackages(packages: PackageData[]): Promise<boolean>;
  validateAllPackagesInProject(): Promise<void>;
}
