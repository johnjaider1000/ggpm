export interface ICommandMapper {
  mapCommandToPackageManager(commandName: string): string;
}
