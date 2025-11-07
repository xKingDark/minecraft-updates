import Version from "../util/version.ts";
export abstract class Platform {
    public abstract name: string;
    public message: string = "Placeholder platform release text!";
    public download: string = "https://www.minecraft.net/en-us/about-minecraft";

    public fetchPreview: boolean = false;
    public latestVersion: Version = new Version(0, 0, 0);

    constructor(fetchPreview: boolean = false) {
        this.fetchPreview = fetchPreview;
    };

    public abstract fetchLatestVersion(): Promise<Version>;
};