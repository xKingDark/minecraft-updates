export default class Version {
    public readonly major: number;
    public readonly minor: number;
    public readonly patch: number;
    public readonly revision: number;
    public readonly isBeta: boolean;
    
    constructor(
        major: number,
        minor: number,
        patch: number,
        revision: number = 0,
        isBeta: boolean = false
    ) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
        this.revision = revision;
        this.isBeta = isBeta;
    };

    public encode(): number {
        return (
            this.major << 24
            | this.minor << 16
            | this.patch << 8
            | this.revision
        );
    };

    public static decode(encoded: number): Version {
        return new Version(
            (encoded >> 24) & 0xFF,
            (encoded >> 16) & 0xFF,
            (encoded >> 8) & 0xFF,
            (encoded) & 0xFF
        );
    };

    public toString(): string {
        const versions = [ this.major, this.minor, this.patch ];
        if (this.isBeta)
            return [ ...versions, this.revision ].join(".");

        return versions.join(".");
    };

    public toJSON(): string {
        return this.toString();
    };

    /**
     * @deprecated Use {@link Version.fromUpdatedString} instead.
     */
    public static fromString(version: string): Version {
        const regex = /(\d+)\.(\d+)(?:\.(\d+))?(?:\.(\d+))?/;
        try {
            const result = regex.exec(version);
            if (result != void 0) {
                const [ _, major, minor, patch, revision ] = result.map(Number);
                return new Version(major, minor, patch || 0, revision < 20 ? 0 : (revision || 0), revision >= 20);
            };
        } catch {};
        return new Version(0, 0, 0);
    };

    public static fromUpdatedString(version: string): Version {
        const regex = /(\d+)\.(\d+)(?:\.(\d+))?(?:\.(\d+))?/;
        try {
            const result = regex.exec(version);
            if (result != void 0) {
                const [ _, year, patch, revision ] = result.map(Number);
                return new Version(1, year, patch, revision < 20 ? 0 : (revision || 0), revision >= 20);
            };
        } catch {};
        return new Version(0, 0, 0);
    };
};