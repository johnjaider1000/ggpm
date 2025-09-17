export interface AppConfiguration {
  defaultMinimumReleaseAge: number;
  supportedPackageManagers: string[];
  lockFileMap: Record<string, string>;
  installCommands: string[];
  configFileName: string;
  registryUrl: string;
}

export class AppConfig {
  private static readonly config: AppConfiguration = {
    // Default minimum release age in days
    defaultMinimumReleaseAge: 7,
    
    // Supported package managers
    supportedPackageManagers: ['pnpm', 'npm', 'yarn', 'bun'],
    
    // Lock file to package manager mapping
    lockFileMap: {
      'pnpm-lock.yaml': 'pnpm',
      'yarn.lock': 'yarn',
      'bun.lockb': 'bun'
    },
    
    // Install commands that trigger validation
    installCommands: ['install', 'i', 'add'],
    
    // Configuration file name
    configFileName: '.npmrc',
    
    // NPM registry URL
    registryUrl: 'https://registry.npmjs.org'
  };

  static get(): AppConfiguration {
    return this.config;
  }

  static getDefaultMinimumReleaseAge(): number {
    return this.config.defaultMinimumReleaseAge;
  }

  static getSupportedPackageManagers(): string[] {
    return this.config.supportedPackageManagers;
  }

  static getLockFileMap(): Record<string, string> {
    return this.config.lockFileMap;
  }

  static getInstallCommands(): string[] {
    return this.config.installCommands;
  }

  static getConfigFileName(): string {
    return this.config.configFileName;
  }

  static getRegistryUrl(): string {
    return this.config.registryUrl;
  }
}
