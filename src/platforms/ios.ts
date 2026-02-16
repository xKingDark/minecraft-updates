import { Platform } from "./common.ts";
import Version from "../util/version.ts";
import Logger, { LogLevel } from "../util/logger.ts";

export default class iOS extends Platform {
    static {
        this.register(false);
    };
    
    public name: string = "iOS App Store";
    public override message: string = `This release is out now on the ${this.name}!`;
    public override download: string = "https://apps.apple.com/app/apple-store/id479516143";

    public async fetchLatestVersion(): Promise<Version> {
        try {
            const response = await fetch("https://itunes.apple.com/lookup?id=479516143&country=us", { cache: "no-cache" });
            const { results: [ data ] } = await response.json();

            this.latestVersion = Version.fromString(data["version"]);
        }
        catch(error) {
            Logger.log(LogLevel.Error, "[".concat(this.name, "]"), error);
        };
        
        return this.latestVersion;
    };
};