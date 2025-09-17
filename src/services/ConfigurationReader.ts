const fs = require("fs");
const path = require("path");

import { IConfigurationReader } from "../interfaces/IConfigurationReader";
import { AppConfig } from "../config/AppConfig";

export class ConfigurationReader implements IConfigurationReader {

  getMinimumReleaseAge(): number {
    const npmrcPath = path.join(process.cwd(), AppConfig.getConfigFileName());

    if (!fs.existsSync(npmrcPath)) {
      const defaultAge = AppConfig.getDefaultMinimumReleaseAge();
      console.warn(`⚠️  ${AppConfig.getConfigFileName()} not found, using default value: ${defaultAge} days`);
      return defaultAge;
    }

    try {
      const npmrcContent = fs.readFileSync(npmrcPath, "utf8");
      const lines = npmrcContent.split("\n");

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("minimum-release-age=")) {
          const value = parseInt(trimmedLine.split("=")[1]);
          if (!isNaN(value)) {
            console.log(`📋 Using minimum age from .npmrc: ${value} days`);
            return value;
          }
        }
      }

      const defaultAge = AppConfig.getDefaultMinimumReleaseAge();
      console.warn(`⚠️  minimum-release-age not found in ${AppConfig.getConfigFileName()}, using default value: ${defaultAge} days`);
      return defaultAge;
    } catch (error) {
      console.error(`❌ Error reading ${AppConfig.getConfigFileName()}:`, (error as Error).message);
      return AppConfig.getDefaultMinimumReleaseAge();
    }
  }
}
