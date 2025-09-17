const path = require("path");

import { IApplication } from "../interfaces/IApplication";
import { ICommandMapper } from "../interfaces/ICommandMapper";

export class Application implements IApplication {
  constructor(
    private commandMapper: ICommandMapper,
    private runWrapper: (args: string[]) => Promise<void>
  ) {}

  async run(): Promise<void> {
    // Single Responsibility: Coordinar la ejecución de la aplicación
    const args = process.argv.slice(2);
    const commandName = path.basename(process.argv[1]);
    
    const targetPackageManager = this.commandMapper.mapCommandToPackageManager(commandName);
    
    // Liskov Substitution: Cualquier implementación de ICommandMapper funcionará
    await this.executeWithPackageManager(targetPackageManager, args);
  }

  private async executeWithPackageManager(packageManager: string, args: string[]): Promise<void> {
    const originalArgv1 = process.argv[1];
    process.argv[1] = packageManager;

    try {
      // Dependency Inversion: Depende de la abstracción runWrapper
      await this.runWrapper(args);
    } finally {
      process.argv[1] = originalArgv1;
    }
  }
}
