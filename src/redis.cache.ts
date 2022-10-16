import { CacheIf } from "./interfaces";
const splitter = '@#$%$#@';

export class RedisCache implements CacheIf {
  constructor(
    private readonly nodeId: string,
    private readonly redisClient,
  ) {}

  set(id: string, rt: Date, value: string): Promise<void> {
    return this.redisClient.HSET(this.nodeId, id, `${rt.toString()}${splitter}${value}`);
  }

  delete(id: string) {
    return this.redisClient.HDEL(this.nodeId, id);
  }

  async restore(): Promise<{[key: string]: { rt: Date, str: string }}> {
    const data: { [key:string]: string } = await this.redisClient.HGETALL(this.nodeId) || {};
    const res = {};

    Object.keys(data)
      .forEach(key => {
        const rec = data[key];
        const [rtstr, str] = rec.split(splitter);
        try { res[key] = { rt: new Date(rtstr), str }; } 
        catch (ex) { }
      })

    return res;
  }
}
