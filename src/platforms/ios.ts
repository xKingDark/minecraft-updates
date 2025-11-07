import { Platform } from "./common.ts";
import Version from "../util/version.ts";
export default class iOS extends Platform {
    public name: string = "iOS App Store";
    public override message: string = `This release is out now on the ${this.name}!`;
    public override download: string = "https://apps.apple.com/app/apple-store/id479516143";

    public async fetchLatestVersion(): Promise<Version> {
        try {
            const response = await fetch("https://itunes.apple.com/lookup?id=479516143&country=us", { cache: "no-cache" });
            const { results: [ data ] } = await response.json();

            this.latestVersion = Version.fromString(data["version"]);
        }
        catch(e) {
            console.error(this.name.concat(":"), e);
        };
        
        return this.latestVersion;
    };
};