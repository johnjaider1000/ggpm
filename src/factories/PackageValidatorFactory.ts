import { IPackageValidator } from "../interfaces/IPackageValidator";
import { PackageValidator } from "../services/PackageValidator";
import { PackageInfoFetcher } from "../services/PackageInfoFetcher";
import { ConfigurationReader } from "../services/ConfigurationReader";
import { PackageAgeCalculator } from "../services/PackageAgeCalculator";

export class PackageValidatorFactory {
  static create(): IPackageValidator {
    const packageInfoFetcher = new PackageInfoFetcher();
    const configurationReader = new ConfigurationReader();
    const ageCalculator = new PackageAgeCalculator();

    return new PackageValidator(packageInfoFetcher, configurationReader, ageCalculator);
  }
}
