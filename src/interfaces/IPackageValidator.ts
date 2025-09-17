export interface PackageData {
  name: string;
  version: string;
}

export interface FailedPackage {
  name: string;
  requestedVersion: string;
  suggestedVersion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  failedPackages: FailedPackage[];
}

export interface IPackageValidator {
  validatePackage(packageName: string, requestedVersion?: string): Promise<boolean>;
  validatePackages(packages: PackageData[]): Promise<ValidationResult>;
  validateAllPackagesInProject(): Promise<void>;
}
