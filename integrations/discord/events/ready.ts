import { Client, Events } from "npm:discord.js";
import Logger, { LogLevel } from "../../../src/util/logger.ts";
export default {
    name: Events.ClientReady,
    once: true,
    execute(client: Client) {
        Logger.log(LogLevel.Info, "Discord — Logged in as:", client.user?.tag);
    },
};