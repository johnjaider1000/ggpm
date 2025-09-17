export interface PackageInfo {
  'dist-tags': {
    latest: string;
  };
  versions: {
    [version: string]: {
      time?: string;
    };
  };
  time: {
    [version: string]: string;
  };
}

export interface IPackageInfoFetcher {
  fetchPackageInfo(packageName: string): Promise<PackageInfo>;
}
