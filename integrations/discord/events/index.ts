import * as path from "jsr:@std/path";
import * as fs from "jsr:@std/fs";

import type { Client } from "discord.js";

import Logger, { LogLevel } from "../../../src/util/logger.ts";
export default async function registerEvents(client: Client) {
    const eventsPath = path.fromFileUrl(import.meta.url);
    const eventFiles = [
        ...fs.walkSync(
            path.dirname(eventsPath),
            { includeDirs: false }
        )
    ].filter(
        (file) =>
            file.name !== "index.ts" &&
            file.name !== "types.ts"
    );

    for (const entry of eventFiles) {
        if (entry.name.endsWith(".ts")) {
            const moduleUrl = path.toFileUrl(entry.path).href;
            const event = (await import(moduleUrl)).default;

            if (!event?.name || typeof event.execute !== "function") {
                Logger.log(LogLevel.Warn, "Invalid event file:", entry.path);
                continue;
            };

            client[event.once ? "once" : "on"](
                event.name,
                (...args) => event.execute(client, ...args),
            );
        };
    };
};