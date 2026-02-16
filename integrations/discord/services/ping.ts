import { Message } from "npm:discord.js";

export class PingService {
    private pings: string[];

    constructor() {
        this.pings = JSON.parse(
            Deno.readTextFileSync("integrations/discord/data/pings.json")
        );
    }

    async ping(message: Message, content = "") {
        if (!this.pings?.length)
            return;

        try {
            const reply = await message.reply({
                content:
                    content +
                    "-# " +
                    this.pings.map((id) => `<@${id}>`).join(" "),
                allowedMentions: {
                    parse: ["users"],
                    repliedUser: false,
                },
            });

            try {
                if (await reply.fetch(true) !== void 0) {
                    await reply.delete();
                };
            } catch {};
        } catch {};
    };
};