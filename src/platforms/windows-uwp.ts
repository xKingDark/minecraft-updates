import { Platform } from "./common.ts";
import Version from "../util/version.ts";
import Logger, { LogLevel } from "../util/logger.ts";

export default class WindowsUWP extends Platform {
    static {
        // No longer needed
        // this.register(true);
        // this.register(false);
    };

    public name: string = "Microsoft Store";
    public override message: string = `This release is out now on the ${this.name}!`;

    private readonly PREVIEW_ID = "9P5X4QVLC2XR";
    private readonly RELEASE_ID = "9NBLGGH2JHXJ";

    public async fetchLatestVersion(): Promise<Version> {
        if (true === this.fetchPreview) {
            this.download = "https://www.microsoft.com/store/productId/" + this.PREVIEW_ID;
        }
        else {
            this.download = "https://www.microsoft.com/store/productId/" + this.RELEASE_ID;
        };

        try {
            const productId = this.fetchPreview ? this.PREVIEW_ID : this.RELEASE_ID;
            const response = await fetch(
                `https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=${productId}&market=GB&languages=en-GB,neutral`, {
                    method: "GET",
                    headers: {
                        "User-Agent": "Mozilla/5.0",
                        "Content-Type": "application/json"
                    },
                },
            );

            const data = await response.json();
            if (data.Products.length === 0 || !data.Products[0].DisplaySkuAvailabilities)
                return this.latestVersion;

            const sku = data.Products[0].DisplaySkuAvailabilities[0].Sku;
            const pkg = sku.Properties.Packages.find((pkg) => pkg.Architectures.includes("x64"));
            if (pkg.PackageFullName == void 0)
                return this.latestVersion;

            const version = Version.fromString(pkg.PackageFullName as string);
            let string = version.minor.toString();

            this.latestVersion = new Version(
                version.major,
                Number(
                    string.slice(0, string.length - 2)
                ),
                Number(
                    string.slice(string.length - 2, string.length)
                ),
                version.revision,
                this.fetchPreview ? "preview" : "stable"
            );
        }
        catch(error) {
            Logger.log(LogLevel.Error, "[".concat(this.name, "]"), error);
        };
        
        return this.latestVersion;
    };
};