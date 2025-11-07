import gplay from "npm:google-play-scraper";
import Changelog from "../changelog.ts";

import { Platform } from "./common.ts";
import Version from "../util/version.ts";
export default class Android extends Platform {
    public name: string = "Google Play Store";
    public override message: string = `This release is out now on the ${this.name}!`;
    public override download: string = "https://play.google.com/store/apps/details?id=com.mojang.minecraftpe";

    public async fetchLatestVersion(): Promise<Version> {
        try {
            const data = await gplay.app({
                appId: "com.mojang.minecraftpe",
                lang: "en",
                country: "us",
            });

            this.latestVersion = Version.fromString(data.version);
        }
        catch(e) {
            console.error(this.name.concat(":"), e);
        };
        
        return this.latestVersion;
    };
};