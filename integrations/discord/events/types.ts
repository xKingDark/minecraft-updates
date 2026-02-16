import type { Client } from "npm:discord.js";

export interface DiscordEvent<T extends any[] = any[]> {
    name: string;
    once?: boolean;
    
    execute(client: Client, ...args: T): void | Promise<void>;
};