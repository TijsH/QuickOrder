import {Injectable} from '@angular/core';
import {DateTime} from 'luxon';
import {INewOrder} from '../api/newOrder.model';
import {OrderService} from '../api/order.service';
import {LogService} from '../api/log.service';
import {IStep} from './step.model';
import {IStrategy} from './strategy.model';
import {ToastrService} from 'ngx-toastr';
import {IOrder} from '../api/order.model';

@Injectable({
  providedIn: 'root'
})
export class StrategyService {
  private accessToken = '';
  private accountNumber = '';

  private strategy: IStrategy = {
    buy: {
      orderNumber: 0,
    },
    stopLoss: {
      orderNumber: 0,
    },
    sell: {
      orderNumber: 0,
    },
  };

  private orders: IOrder[] = [];

  constructor(private logService: LogService,
              private toastr: ToastrService,
              private orderService: OrderService) {
  }

  // TODO: all observables cancellen or takeOne o.i.d.

  static getTimeForReferenceId(): string {
    // noinspection TypeScriptValidateJSTypes,SpellCheckingInspection
    return DateTime.local().toFormat('HHmmssSSS');
  }

  static createBuyOrderObject(instrumentId: string, quantity: number, limitPrice: number): INewOrder {
    return {
      type: 'limit',
      quantity,
      duration: 'day',
      limitPrice,
      cash: {
        side: 'buy',
        instrumentId,
      },
      referenceId: `buy_limit_${instrumentId}_${StrategyService.getTimeForReferenceId()}`.substr(0, 40),
    };
  }

  static createStopLossOrderObject(instrumentId: string, quantity: number, stopPrice: number): INewOrder {
    return {
      type: 'stop',
      quantity,
      duration: 'day',
      stopPrice,
      cash: {
        side: 'sell',
        instrumentId,
      },
      referenceId: `sell_stop_${instrumentId}_${StrategyService.getTimeForReferenceId()}`.substr(0, 40),
    };
  }

  static createSellOrderObject(instrumentId: string, quantity: number): INewOrder {
    return {
      type: 'market',
      quantity,
      duration: 'day',
      cash: {
        side: 'sell',
        instrumentId,
      },
      referenceId: `sell_market_${instrumentId}_${StrategyService.getTimeForReferenceId()}`.substr(0, 40),
    };
  }

  setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
  }

  setAccountNumber(accountNumber: string) {
    this.accountNumber = accountNumber;
  }

  getStrategy(): IStrategy {
    return this.strategy;
  }

  getOrders(): IOrder[] {
    return this.orders;
  }

  submitOrder(newOrder: INewOrder) {
    this.orderService.validateNewOrder(this.accessToken, this.accountNumber, newOrder)
      .subscribe(validateResult => {
        if (validateResult.previewOrder.orderCanBeRegistered) {
          newOrder.validationCode = validateResult.previewOrder.validationCode;
          this.orderService.placeOrder(this.accessToken, this.accountNumber, newOrder)
            .subscribe();
        }
      });
  }

  cancelOrder(step: IStep) {
    if (!step.orderNumber) {
      return;
    }
    this.cancelOrderNumber(step.orderNumber);
  }

  cancelOrderNumber(orderNumber: number) {
    if (!orderNumber) {
      return;
    }

    return this.orderService.cancelOrder(this.accessToken, this.accountNumber, orderNumber)
      .subscribe();
  }

  createStrategy(accessToken: string, accountNumber: string,
                 instrumentId: string, quantity: number, limitPrice: number, stopPrice: number) {
    if (!instrumentId) {
      return;
    }

    const buy: IStep = {
      newOrder: StrategyService.createBuyOrderObject(instrumentId, quantity, limitPrice),
      orderNumber: 0,
    };
    const stopLoss: IStep = {
      newOrder: StrategyService.createStopLossOrderObject(instrumentId, quantity, stopPrice),
      orderNumber: 0,
    };
    const sell: IStep = {
      newOrder: StrategyService.createSellOrderObject(instrumentId, quantity),
      orderNumber: 0,
    };

    this.strategy = {
      buy,
      stopLoss,
      sell,
    };

    // start the strategy
    this.submitOrder(this.strategy.buy.newOrder);
  }


  sellStrategy() {
    if (!this.strategy.stopLoss.orderNumber) {
      this.submitOrder(this.strategy.sell.newOrder);
      return;
    }

    this.cancelOrder(this.strategy.stopLoss);
  }

  getOrdersFromBinck() {
    this.orderService
      .getOrders(this.accessToken, this.accountNumber)
      .subscribe(result => {
        this.orders = result.ordersCollection.orders;
      });
  }

  orderStatusNotification(orderStatus: any) {
    this.getOrdersFromBinck();
    this.logService.log('Orders', 'OrderStatus', orderStatus);
    this.toastr.info(`${orderStatus.number} ${orderStatus.status}`, 'OrderStatus');


    console.log('orderStatusNotification', this.strategy);
    if (!this.strategy) {
      return;
    }

    if (orderStatus.status === 'placed') {
      if (this.strategy.buy && this.strategy.buy.newOrder.referenceId === orderStatus.referenceId) {
        this.strategy.buy.orderNumber = orderStatus.number;
      }
      if (this.strategy.stopLoss && this.strategy.stopLoss.newOrder.referenceId === orderStatus.referenceId) {
        this.strategy.stopLoss.orderNumber = orderStatus.number;
      }
      if (this.strategy.sell && this.strategy.sell.newOrder.referenceId === orderStatus.referenceId) {
        this.strategy.sell.orderNumber = orderStatus.number;
      }
    }

    if (this.strategy.stopLoss && orderStatus.number === this.strategy.stopLoss.orderNumber && ['canceled'].includes(orderStatus.status)) {
      // continue the strategy
      this.submitOrder(this.strategy.sell.newOrder);
    }
  }

  orderModifiedNotification(order: any) {
    this.getOrdersFromBinck();
    this.logService.log('Orders', 'OrderModified', order);
    this.toastr.info(order, 'OrderModified');
  }

  orderExecutionNotification(order: any) {
    this.getOrdersFromBinck();
    this.logService.log('Orders', 'OrderExecution', order);
    this.toastr.info(`${order.number} ${order.status}`, 'OrderExecution');

    console.log('orderExecutionNotification', this.strategy);
    if (!this.strategy) {
      return;
    }

    if (this.strategy.buy &&
      order.number === this.strategy.buy.orderNumber &&
      ['completelyExecuted', 'remainderExecuted'].includes(order.status)) {
      // continue the strategy
      this.submitOrder(this.strategy.stopLoss.newOrder);
    }
  }
}
