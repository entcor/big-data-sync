import { CacheIf } from "./interfaces";
import TagLogger from 'etaglogger';
import { promisify } from "util";

const logd = TagLogger('BDS.CACHE');

const splitter = '@#$%$#@';

export class RedisCache implements CacheIf {
  constructor(
    private readonly nodeId: string,
    private readonly redisClient,
  ) {}

  set(id: string, rt: Date, value: string, expire?: Date): Promise<void> {
    logd('bds cache => set', id)
    return this.redisClient.HSET(this.nodeId, id, `${rt.toString()}${splitter}${value}${splitter}${expire && expire.getTime()}`);
  }

  delete(id: string) {
    logd('bds cache => delete', id)
    return this.redisClient.HDEL(this.nodeId, id);
  }

  reset() {
    return this.redisClient.DEL(this.nodeId);
  }

  async restore(): Promise<{[key: string]: { rt: Date, str: string }}> {
    logd('bds cache => cache restore')
    const HGETALL = promisify(this.redisClient.HGETALL).bind(this.redisClient);
    const data: { [key:string]: string } = (await HGETALL(this.nodeId)) || {};
    const res = {};

    Object.keys(data)
      .forEach(key => {
        const rec = data[key];
        const [rtstr, str, expire] = rec.split(splitter);
        try { res[key] = { rt: new Date(rtstr), str, expire: new Date(expire) }; } 
        catch (ex) { }
      })

    logd('bds cache => cache restored', Object.keys(res).length);

    return res;
  }
}
