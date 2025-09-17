import { IApplication } from "../interfaces/IApplication";
import { Application } from "../services/Application";
import { PackageManagerDetector } from "../services/PackageManagerDetector";
import { CommandMapper } from "../services/CommandMapper";

export class ApplicationFactory {
  static create(runWrapper: (args: string[]) => Promise<void>): IApplication {
    // Dependency Injection Container
    const packageManagerDetector = new PackageManagerDetector();
    const commandMapper = new CommandMapper(packageManagerDetector);
    
    return new Application(commandMapper, runWrapper);
  }
}
