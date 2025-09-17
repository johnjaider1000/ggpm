import { ICommandMapper } from "../interfaces/ICommandMapper";
import { IPackageManagerDetector } from "../interfaces/IPackageManagerDetector";

export class CommandMapper implements ICommandMapper {
  private readonly packageManagerDetector: IPackageManagerDetector;
  private readonly commandMap = {
    "gnpm": "npm",
    "gpnpm": "pnpm", 
    "gyarn": "yarn",
    "gbun": "bun"
  };

  constructor(packageManagerDetector: IPackageManagerDetector) {
    this.packageManagerDetector = packageManagerDetector;
  }

  mapCommandToPackageManager(commandName: string): string {
    // Dependency Inversion: Depende de abstracción, no de implementación concreta
    if (commandName === "ggpm") {
      return this.packageManagerDetector.detect();
    }

    // Open/Closed Principle: Fácil agregar nuevos comandos
    return this.commandMap[commandName] || "npm";
  }
}
