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

  set(id: string, rt: Date, value: string, filteredValue: string, expire?: Date): Promise<void> {
    logd(`bds cache (${this.nodeId}) => set`, id, [this.nodeId])
    return this.redisClient.HSET(this.nodeId, id, `${rt.toString()}${splitter}${value}${splitter}${filteredValue}${splitter}${expire && expire.getTime()}`);
  }

  delete(id: string) {
    logd(`bds cache (${this.nodeId}) => delete`, id, [this.nodeId])
    return this.redisClient.HDEL(this.nodeId, id);
  }

  reset() {
    return this.redisClient.DEL(this.nodeId);
  }

  async restore(): Promise<{[key: string]: { rt: Date, str: string, filteredStr: string }}> {
    logd(`bds cache (${this.nodeId}) => cache restore`, [this.nodeId])
    const HGETALL = promisify(this.redisClient.HGETALL).bind(this.redisClient);
    const data: { [key:string]: string } = (await HGETALL(this.nodeId)) || {};
    const res = {};

    Object.keys(data)
      .forEach(key => {
        const rec = data[key];
        const [rtstr, str, filteredStr, expire] = rec.split(splitter);
        console.log('rec', rec);
        try { res[key] = { rt: new Date(rtstr), str: parseStr(str), filteredStr: parseStr(filteredStr), expire: parseTime(expire) }; } 
        catch (ex) { }
      })

    logd(`bds cache (${this.nodeId}) => cache restored`, Object.keys(res).length, [this.nodeId]);

    return res;

    function parseStr(s) { return s === 'undefined' ? undefined : s; }
    function parseTime(s) { return s === 'undefined' ? undefined : new Date(parseInt(s, 10)); }
  }
}
