import {IStep} from './step.model';

export interface IStrategy {
  buy: IStep;
  stopLoss: IStep;
  sell: IStep;
}
