import {INewOrder} from '../api/newOrder.model';

export interface IStep {
  newOrder?: INewOrder;
  orderNumber: number;
}
