export interface CacheIf {
    set: (id: string, rt: Date, value: string, expire?: Date) => Promise<void>;
    restore: () => Promise<{
        [key: string]: {
            rt: Date;
            str: string;
            expire?: Date;
        };
    }>;
    delete: (id: string) => {};
}
//# sourceMappingURL=interfaces.d.ts.map