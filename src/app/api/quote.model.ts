export interface IQuote {
  id?: string;
  lvl?: number;
  sdt?: string;
  qt?: [{
    msg?: string;
    typ?: string;
    prc?: number;
    vol?: number;
    ord?: number;
    dt?: string;
    tags?: string;
  }];
}
