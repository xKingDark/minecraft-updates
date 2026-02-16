import { EventEmitter } from "https://deno.land/x/event@2.0.0/mod.ts";
import { IntegrationEvents } from "./events.ts";
import * as path from "jsr:@std/path";
import * as fs from "jsr:@std/fs";

type IntegrationConstructor<T extends any[] = any[]> = new (...args: T) => Integration;
type IntegrationRegistration = {
    ctor: IntegrationConstructor;
    args: any[];
};

export abstract class Integration extends EventEmitter<IntegrationEvents> {
    private static REGISTRY: IntegrationRegistration[] = [];
    private static INSTANCES: Integration[] = [];

    public abstract start(): any;

    protected static register<T extends IntegrationConstructor>(this: T, ...args: ConstructorParameters<T>) {
        Integration.REGISTRY.push({ ctor: this, args });
    };

    public static clear() {
        this.INSTANCES = [];
        this.REGISTRY = [];
    };

    public static getRegistered(): IntegrationRegistration[] {
        return this.REGISTRY;
    };

    public static getInstances(): Integration[] {
        return [...Integration.INSTANCES];
    };

    public static async createAll(
        directory: string | URL = new URL("./", import.meta.url)
    ): Promise<Integration[]> {
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

        this.INSTANCES = Integration.REGISTRY
            .map(({ ctor, args }) => new ctor(...args));

        return this.INSTANCES;
    };

    public static async emit<K extends keyof IntegrationEvents>(
        event: K,
        ...args: IntegrationEvents[K]
    ) {
        if (this.INSTANCES.length !== this.REGISTRY.length) {
            await this.createAll();
        };

        for (const instance of Integration.INSTANCES) {
            try {
                instance.emit(event, ...args);
            } catch {};
        };
    };
};