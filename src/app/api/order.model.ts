export interface IOrder {
  number: number;
  instrument: any;
  type: string;
  statusHistory: any[];
  currency: string;
  duration?: string;
  line?: number;
  side?: string;
  executedQuantity?: number;
  limitPrice?: number;
  averagePrice?: number;
  quantity?: number;
  expirationDate?: string;
  lastStatus?: string;
  stopPrice?: number;
  rejectionReason?: string;
  fixingPrice?: number;
  rejectionReasonDetail?: string;
  condition?: string;
  referenceId?: string;
}
