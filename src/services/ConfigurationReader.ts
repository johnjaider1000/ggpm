const fs = require("fs");
const path = require("path");

import { IConfigurationReader } from "../interfaces/IConfigurationReader";
import { AppConfig } from "../config/AppConfig";

export class ConfigurationReader implements IConfigurationReader {

  getMinimumReleaseAge(): number {
    const npmrcPath = path.join(process.cwd(), AppConfig.getConfigFileName());

    if (!fs.existsSync(npmrcPath)) {
      const defaultAge = AppConfig.getDefaultMinimumReleaseAge();
      console.warn(`⚠️  No se encontró ${AppConfig.getConfigFileName()}, usando valor por defecto: ${defaultAge} días`);
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
            console.log(`📋 Usando edad mínima desde .npmrc: ${value} días`);
            return value;
          }
        }
      }

      const defaultAge = AppConfig.getDefaultMinimumReleaseAge();
      console.warn(`⚠️  No se encontró minimum-release-age en ${AppConfig.getConfigFileName()}, usando valor por defecto: ${defaultAge} días`);
      return defaultAge;
    } catch (error) {
      console.error(`❌ Error leyendo ${AppConfig.getConfigFileName()}:`, (error as Error).message);
      return AppConfig.getDefaultMinimumReleaseAge();
    }
  }
}
