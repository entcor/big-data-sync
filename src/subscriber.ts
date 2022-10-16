import BDS from "./dataSync";

const subscribers = {};

const unique = (value, index, self) => {
  return self.indexOf(value) === index
}

export class BdsSubscriber {
  private idList: string[] = [];

  constructor(private readonly bds: BDS, onData: () => {}) {
    bds.on('data', (data) => {
      const sData = data.filter();
      if (sData.legth) onData(sData);
    });
  }

  subscribe(idList: string[]) {
    this.idList = [...this.idList, ...idList].filter(unique);
  }

  unsubscribe(idList: string[]) {
    this.idList = this.idList.filter((el: string) => !idList.find(el, 0));
  }
}

export function newSubscriber(clientId: string, bds: BDS, idList: string[]) {
  const sInst = subscribers[clientId] || new BdsSubscriber(bds);
  return sInst;
}

export function removeSubscriber(id: string) {
  delete subscribers
}


