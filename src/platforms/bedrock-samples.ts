const isWindows = process.platform === "win32";
import { Platform } from "./common.ts";
import Version from "../util/version.ts";
import Logger, { LogLevel } from "../util/logger.ts";

export default class BedrockSamples extends Platform {
    static {
        this.register(true);
        this.register(false);
    }
    
    public name: string = "Bedrock Samples";
    public override message: string = `The Bedrock samples repository has been updated for this release!`;
    public override download: string = "https://github.com/Mojang/bedrock-samples";

    public async fetchLatestVersion(): Promise<Version> {
        if (true === this.fetchPreview) {
            this.download = "https://github.com/Mojang/bedrock-samples/tree/preview";
        }

        try {
            const response = await fetch(`https://raw.githubusercontent.com/Mojang/bedrock-samples/refs/heads/${this.fetchPreview ? "preview" : "main"}/version.json`);
            const data = await response.json();

            const latest = data["latest"]?.version;
            this.latestVersion = Version.fromString(latest);
        }
        catch(error) {
            Logger.log(LogLevel.Error, "[".concat(this.name, "]"), error);
        }
        
        return this.latestVersion;
    }
}