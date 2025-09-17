export interface IPackageManagerDetector {
  detect(): string;
  isInstalled(packageManager: string): boolean;
}
