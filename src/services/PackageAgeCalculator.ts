import { IPackageAgeCalculator } from "../interfaces/IPackageAgeCalculator";

export class PackageAgeCalculator implements IPackageAgeCalculator {
  calculateAge(publishDate: string): number {
    const now = new Date();
    const published = new Date(publishDate);
    const diffTime = Math.abs(now.getTime() - published.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}
