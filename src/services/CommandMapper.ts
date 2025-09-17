import { ICommandMapper } from "../interfaces/ICommandMapper";
import { IPackageManagerDetector } from "../interfaces/IPackageManagerDetector";

export class CommandMapper implements ICommandMapper {
  private readonly commandMap: { [key: string]: string } = {
    "g/npm": "npm",
    "g/pnpm": "pnpm",
    "g/yarn": "yarn",
    "g/bun": "bun",
  };

  constructor(private packageManagerDetector: IPackageManagerDetector) {}

  mapCommandToPackageManager(commandName: string): string {
    // Dependency Inversion: Depende de abstracción, no de implementación concreta
    if (commandName === "ggpm") {
      return this.packageManagerDetector.detect();
    }

    // Open/Closed Principle: Fácil agregar nuevos comandos
    return this.commandMap[commandName] || "npm";
  }
}
