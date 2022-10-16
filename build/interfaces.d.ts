export interface CacheIf {
    set: (id: string, rt: Date, value: string) => Promise<void>;
    restore: () => Promise<{
        [key: string]: {
            rt: Date;
            str: string;
        };
    }>;
    delete: (id: string) => {};
}
//# sourceMappingURL=interfaces.d.ts.map