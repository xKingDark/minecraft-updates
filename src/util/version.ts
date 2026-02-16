export default class Version {
    private static readonly MARKETING_SHIFT = 26;

    constructor(
        public readonly major: number,
        public readonly minor: number,
        public readonly patch: number,
        public readonly revision?: number,
        public readonly stage?: string
    ) {
        if (this.stage !== void 0) {
            this.stage = "stable";
        };
    };

    public static encode(major: number, minor: number, patch: number, revision?: number, stage?: string) {
        return (
            (major << 24)
            | (minor << 16)
            | (stage === "preview" ? patch ?? 0 : 0)
            | (revision ?? 0)
        );
    };
    
    public encode(): number {
        return Version.encode(this.major, this.minor, this.patch, this.revision, this.stage);
    };

    public static decode(encoded: number): Version {
        return new Version(
            (encoded >> 24) & 0xFF,
            (encoded >> 16) & 0xFF,
            (encoded >> 8) & 0xFF,
            (encoded) & 0xFF
        );
    };

    public getBranch(): string {
        return `r/${this.minor}_u${Math.floor(this.patch / 10)}`;
    };

    public toSemVer(includeDot: boolean = true): string {
        let base = `${this.major}.${this.minor}.${this.patch}`;

        if (this.stage) {
            base += `-${this.stage}`;
            if (this.revision !== undefined && this.stage !== "stable") {
                base += `${includeDot ? "." : ""}${this.revision}`;
            };

            return base;
        };

        if (this.revision !== undefined) {
            return `${base}.${this.revision}`;
        };

        return base;
    };

    public toString(): string {
        const versions = [ this.major, this.minor, this.patch, this.revision ]
            .filter((v) => v !== void 0);

        return versions.join(".");
    };

    public toJSON(): string {
        return this.toString();
    };

    public static fromString(input: string): Version {
        const match = input.match(/(\d+\.\d+(?:\.\d+)?(?:\.\d+)?(?:-[a-zA-Z]+(?:\.\d+)?)?)/);
        return match
            ? Version.parse(match[1])
            : new Version(0, 0, 0);
    };

    private static normalize(version: string): string {
        const parts = version.split(".");

        if (parts[0] === "1" && Number(parts[1]) >= this.MARKETING_SHIFT) {
            return parts.slice(1).join(".");
        };

        return version;
    };

    public static parse(version?: string): Version {
        if (version === void 0) {
            return new Version(0, 0, 0);
        };

        const normalized = Version.normalize(version);
        const [ core, stagePart ] = normalized.split("-");
        const parts = core.split(".").map(Number);

        const major = parts[0] ?? 0;
        const minor = parts[1] ?? 0;
        const revision = parts[2];
        const build = parts[3];

        let stage: string | undefined;
        let stageRevision: number | undefined;

        if (stagePart) {
            const [name, rev] = stagePart.split(".");
            
            stage = name;
            stageRevision = rev ? Number(rev) : undefined;
        };

        return new Version(
            major,
            minor,
            revision ?? stageRevision,
            build,
            stage ?? (revision >= 20 ? "preview" : "stable")
        );
    };
};