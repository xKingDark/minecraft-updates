import * as path from "jsr:@std/path";
import * as fs from "jsr:@std/fs";
import Version from "../util/version.ts";

type PlatformConstructor<T extends any[] = any[]> = new (...args: T) => Platform;
type PlatformRegistration = {
    ctor: PlatformConstructor;
    args: any[];
};

export abstract class Platform {
    public abstract name: string;
    public message: string = "Placeholder platform release text!";
    public download: string = "https://www.minecraft.net/en-us/about-minecraft";

    public fetchPreview: boolean = false;
    public latestVersion: Version = new Version(0, 0, 0);
    public directLink: string | undefined;

    constructor(fetchPreview: boolean = false) {
        this.fetchPreview = fetchPreview;
    };

    public abstract fetchLatestVersion(): Promise<Version>;

    // Platform registration
    private static REGISTRY: PlatformRegistration[] = [];
    private static INSTANCES: Platform[] = [];

    protected static register<T extends PlatformConstructor>(this: T, ...args: ConstructorParameters<T>) {
        Platform.REGISTRY.push({ ctor: this, args });
    };

    public static clear() {
        this.INSTANCES = [];
        this.REGISTRY = [];
    };
    public static getRegistered(): PlatformRegistration[] {
        return this.REGISTRY;
    };

    public static getInstances(): Platform[] {
        return [...Platform.INSTANCES];
    };

    public static async createAll(
        directory: string | URL = new URL("./", import.meta.url)
    ): Promise<Platform[]> {
        if (this.INSTANCES.length > 0) {
            return this.INSTANCES;
        };

        const directoryUrl =
            typeof directory === "string"
                ? path.resolve(directory)
                : path.fromFileUrl(directory);
        
        const directoryPath = path.toFileUrl(directoryUrl);
        for await (const entry of fs.walkSync(directoryPath)) {
            if (entry.name.endsWith(".ts")) {
                const moduleUrl = path.toFileUrl(entry.path).href;
                await import(moduleUrl);
            };
        };

        this.INSTANCES = Platform.REGISTRY
            .map(({ ctor, args }) => new ctor(...args));

        return this.INSTANCES;
    };
};