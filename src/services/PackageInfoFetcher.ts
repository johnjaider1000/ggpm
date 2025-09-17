const https = require("https");

import { IPackageInfoFetcher, PackageInfo } from "../interfaces/IPackageInfoFetcher";
import { AppConfig } from "../config/AppConfig";

export class PackageInfoFetcher implements IPackageInfoFetcher {
  async fetchPackageInfo(packageName: string): Promise<PackageInfo> {
    return new Promise((resolve, reject) => {
      const url = `${AppConfig.getRegistryUrl()}/${packageName}`;

      https.get(url, (res: any) => {
        let data = "";

        res.on("data", (chunk: any) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const packageInfo = JSON.parse(data) as PackageInfo;
            resolve(packageInfo);
          } catch (error) {
            reject(error);
          }
        });
      }).on("error", (error: any) => {
        reject(error);
      });
    });
  }
}
