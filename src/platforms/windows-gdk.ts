import { Platform } from "./common.ts";
import Version from "../util/version.ts";
import XboxApp from "./xbox-app.ts";
export default class WindowsGDK extends Platform {
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
            const XBOX_HEADER = Deno.env.get("XBOX_HEADER");
            if (XBOX_HEADER === void 0)
                return this.latestVersion;

            const versions = await XboxApp.getVersions(this.fetchPreview ? XboxApp.WINDOWS_PREVIEW_ID : XboxApp.WINDOWS_RELEASE_ID, XBOX_HEADER);
            if (versions === void 0)
                return this.latestVersion;

            const version = Version.fromString(versions[0] as string);
            let string = version.patch.toString();

            this.directLink = versions[0];
            this.latestVersion = new Version(
                version.major,
                version.minor,
                Number(string.slice(0, string.length - 2)),
                this.fetchPreview ? Number(string.slice(string.length - 2, string.length)) : 0,
                this.fetchPreview
            );
        }
        catch {};
        
        return this.latestVersion;
    };
};