const fs = require("fs");
const path = require("path");

import { IConfigurationReader } from "../interfaces/IConfigurationReader";
import { AppConfig } from "../config/AppConfig";

export class ConfigurationReader implements IConfigurationReader {

  getMinimumReleaseAge(): number {
    const npmrcPath = this.getConfigPath();
    
    return this.fileExists(npmrcPath) 
      ? this.readConfigFromFile(npmrcPath)
      : this.getDefaultWithWarning();
  }

  private getConfigPath(): string {
    return path.join(process.cwd(), AppConfig.getConfigFileName());
  }

  private fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  private readConfigFromFile(npmrcPath: string): number {
    try {
      const content = fs.readFileSync(npmrcPath, "utf8");
      const configValue = this.extractConfigValue(content);
      
      return configValue ?? this.getDefaultWithConfigNotFoundWarning();
    } catch (error) {
      return this.handleReadError(error as Error);
    }
  }

  private extractConfigValue(content: string): number | null {
    const lines = content.split("\n");
    
    for (const line of lines) {
      const configValue = this.parseConfigLine(line.trim());
      
      if (configValue !== null) {
        console.log(`📋 Using minimum age from .npmrc: ${configValue} days`);
        return configValue;
      }
    }
    
    return null;
  }

  private parseConfigLine(line: string): number | null {
    const isConfigLine = line.startsWith("minimum-release-age=");
    
    if (!isConfigLine) return null;
    
    const value = parseInt(line.split("=")[1]);
    return isNaN(value) ? null : value;
  }

  private getDefaultWithWarning(): number {
    const defaultAge = AppConfig.getDefaultMinimumReleaseAge();
    console.warn(`⚠️  ${AppConfig.getConfigFileName()} not found, using default value: ${defaultAge} days`);
    return defaultAge;
  }

  private getDefaultWithConfigNotFoundWarning(): number {
    const defaultAge = AppConfig.getDefaultMinimumReleaseAge();
    console.warn(`⚠️  minimum-release-age not found in ${AppConfig.getConfigFileName()}, using default value: ${defaultAge} days`);
    return defaultAge;
  }

  private handleReadError(error: Error): number {
    console.error(`❌ Error reading ${AppConfig.getConfigFileName()}:`, error.message);
    return AppConfig.getDefaultMinimumReleaseAge();
  }
}
