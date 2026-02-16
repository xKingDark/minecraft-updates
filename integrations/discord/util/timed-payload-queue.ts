import {
    ActionRowBuilder,
    ButtonBuilder,
    ContainerBuilder,
    MessageFlags,

    Channel,
    SectionBuilder,
    ButtonStyle
} from "npm:discord.js";
export default class TimedPayloadQueue {
    private payloads: any[] = [];
    private timeoutId: number | null = null;

    constructor(
        private channel: Channel | undefined,
        private delay = 5 * 1000
    ) {};

    add(payload: any) {
        this.payloads.push(payload);
        if (!this.timeoutId) {
            this.timeoutId = setTimeout(() => this.flush(), this.delay);
        };
    };

    async flush() {
        if (this.payloads.length === 0)
            return;

        if (this.channel === void 0 || !this.channel.isSendable())
            return;

        const payloads: Function[] = [];
        const container = new ContainerBuilder();
        const row = new ActionRowBuilder<ButtonBuilder>();

        for (let i = 0; i < this.payloads.length; i++) {
            const payload = this.payloads[i];

            if (payload[2] !== void 0) {
                const section = new SectionBuilder()
                    .addTextDisplayComponents(payload[0])
                    .setButtonAccessory(
                        new ButtonBuilder()
                            .setLabel("Link")
                            .setStyle(ButtonStyle.Link)
                            .setURL(payload[2])
                    );

                container.addSectionComponents(section);
            }
            else {
                container.addTextDisplayComponents(payload[0]);
            };

            row.addComponents([ payload[1] ]);
            
            if (i < this.payloads.length - 1) {
                container.addSeparatorComponents((separator) => separator.setDivider(true));
            };

            payloads.push(payload[3]);
        };

        this.payloads = [];
        this.timeoutId = null;

        try {
            const message = await this.channel.send({
                flags: MessageFlags.IsComponentsV2,
                components: [
                    container, row
                ],
            });

            // Pin the message
            message
                .pin()
                .catch(() => {});

            for (let i = 0; i < payloads.length; i++) {
                payloads[i](message);
            };
        }
        catch(error) {
            console.error(error);
        };
    };
};