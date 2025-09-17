#!/usr/bin/env node

// Legacy compatibility exports - using new SOLID architecture
import { PackageValidatorFactory } from "./factories/PackageValidatorFactory";

// Backward compatibility functions
export async function checkPackageAge(packageName: string, requestedVersion?: string): Promise<boolean> {
  const validator = PackageValidatorFactory.create();
  return validator.validatePackage(packageName, requestedVersion);
}

export async function checkAllPackages(): Promise<void> {
  const validator = PackageValidatorFactory.create();
  return validator.validateAllPackagesInProject();
}
