import { Platform } from "./common.ts";
import Version from "../util/version.ts";
import XboxApp from "./xbox-app.ts";
export default class Xbox extends Platform {
    public name: string = "Xbox Series S/X";
    public override message: string = `This release is out now on the ${this.name}!`;

    private readonly PREVIEW_ID = "9NQ19C36R0VD";
    private readonly RELEASE_ID = "9MVXMVT8ZKWC";

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

            const versions = await XboxApp.getVersions(this.fetchPreview ? XboxApp.XBOX_PREVIEW_ID : XboxApp.XBOX_RELEASE_ID, XBOX_HEADER);
            if (versions === void 0)
                return this.latestVersion;

            const version = Version.fromString(versions[0] as string);
            let string = version.patch.toString();

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