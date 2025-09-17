export interface IPackageAgeCalculator {
  calculateAge(publishDate: string): number;
}
