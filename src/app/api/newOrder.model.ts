export type OrderTypes = 'limit' | 'market' | 'stop' | 'stopLimit';
export type Durations = 'day' | 'goodTillCancelled' | 'goodTillDate';

export interface INewOrder {
  type: OrderTypes;
  quantity: number;
  duration: Durations;
  expirationDate?: string;
  limitPrice?: number;
  stopPrice?: number;
  cash?: {
    side: string;
    instrumentId: string
  };
  srd?: {
    side: string;
    instrumentId: string
  };
  option?: {
    condition: string;
    leg1: {
      side: string;
      instrumentId: string
    };
    leg2: {
      side: string;
      instrumentId: string
    }
  };
  future?: {
    side: string;
    instrumentId: string
  };
  validationCode?: string;
  referenceId?: string;
}
