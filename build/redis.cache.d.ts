import { CacheIf } from "./interfaces";
export declare class RedisCache implements CacheIf {
    private readonly nodeId;
    private readonly redisClient;
    constructor(nodeId: string, redisClient: any);
    set(id: string, rt: Date, value: string): Promise<void>;
    delete(id: string): any;
    restore(): Promise<{
        [key: string]: {
            rt: Date;
            str: string;
        };
    }>;
}
//# sourceMappingURL=redis.cache.d.ts.map