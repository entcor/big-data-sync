export interface CacheIf {
    set: (id: string, rt: Date, value: string, filteredValue: string, expire?: Date) => Promise<void>;
    restore: () => Promise<{
        [key: string]: {
            rt: Date;
            str: string;
            filteredStr: string;
            expire?: Date;
        };
    }>;
    delete: (id: string) => {};
    reset: () => {};
}
//# sourceMappingURL=interfaces.d.ts.map