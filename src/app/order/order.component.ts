import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {select, Store} from '@ngrx/store';
import {ToastrService} from 'ngx-toastr';
import hotkeys from 'hotkeys-js';
import {IAppState} from '../store/app.state';
import {IAccess} from '../store/access.model';
import {InstrumentService} from '../api/instrument.service';
import {catchError, takeUntil} from 'rxjs/operators';
import {EMPTY, Subject} from 'rxjs';
import {Decimal} from 'decimal.js';
import {INewOrder} from '../api/newOrder.model';
import {OrderService} from '../api/order.service';
import * as signalR from '@aspnet/signalr';
import {ApiService} from '../api/api.service';
import {SetAccess} from '../store/access.actions';
import {SetAccount} from '../store/account.actions';
import {Router} from '@angular/router';
import {IQuote} from '../api/quote.model';
import {NumberToTrack} from '../api/numberToTrack.class';


interface IOrder {
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


@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent implements OnInit, OnDestroy {
  private loginUrl: string;
  private lastTokenRefresh = 0;
  private lastStreamingTime = '';
  private lastStreamingTimeClass = '';
  private lastStreamingTimeClassIntervalId: any;
  private connectionClosedCount = new NumberToTrack('abs');
  private intervalId: any;
  private tokenAge: number;
  private apiVersion: any = {};
  private access: IAccess = {};
  private accountNumber = '';
  private instruments = [];
  private orders: IOrder[] = [];
  private instrument: any = {};
  private currentTickSize = 0.0001;
  private currentAddToPrice = 0;
  private currentSubtractFromPrice = 0;
  private askPrice = new NumberToTrack();
  private bidPrice = new NumberToTrack();
  private totalBuy = new NumberToTrack('abs');
  private totalSell = new NumberToTrack('abs');
  private maxLoss = new NumberToTrack('abs');
  private priceSpread = new NumberToTrack('abs');
  private priceSpreadPercentage = new NumberToTrack('abs');
  private currentAskPriceDecimals = 4;
  private quotes: any = {};
  private quoteSubscriptionLevel = '';
  private instrumentCount = 0;
  private message: any;
  private error: any;
  private validateResult: any;
  private placeResult: any;
  private instrumentQuery = new FormControl('');
  private orderNumberToCancel = new FormControl('');
  private connection: any = {};
  private currentlySubscribedInstrumentId: string;
  private currentDate = new Date().toISOString().substring(0, 10);
  private currentDateT = new Date().toISOString().substring(0, 11);

  private buyOrderNumber = 0;
  private stopLossOrderNumber = 0;
  private sellOrderNumber = 0;

  private setStopLossOnBuyOrderNumber = 0;
  private setSellOrderOnStopLossCancelNumber = 0;

  orderForm = this.formBuilder.group({
    instrumentId: ['',
      [
        Validators.required
      ]
    ],
    quantity: [0,
      [
        Validators.required,
      ]
    ],
    addPercentage: [0,
      [
        Validators.required
      ]
    ],
    limitPrice: [0,
      [
        Validators.required
      ]
    ],
    minusPercentage: [0,
      [
        Validators.required
      ]
    ],
    stopPrice: [0,
      [
        Validators.required
      ]
    ],
  });

  constructor(private store: Store<IAppState>,
              private formBuilder: FormBuilder,
              private router: Router,
              private toastr: ToastrService,
              private apiService: ApiService,
              private instrumentService: InstrumentService,
              private orderService: OrderService) {
  }

  // https://stackoverflow.com/questions/38008334/angular-rxjs-when-should-i-unsubscribe-from-subscription
  private ngUnsubscribe = new Subject();

  ngOnInit() {
    console.log('ngOnInit');
    this.loginUrl = this.apiService.getLoginUrl();

    this.store
      .select('access')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(access => {
        if (!access.access_token) {
          console.log('!access.access_token');
          return;
        }
        if (access.access_token && this.access.access_token !== access.access_token) {
          this.lastTokenRefresh = Date.now();
          this.tokenAge = 0;
        }
        if (access.access_token) {
          this.apiService
            .getAccounts(access.access_token)
            .pipe(
              catchError(error => {
                this.error = error;
                return EMPTY;
              })
            )
            .subscribe(result => {
              const accountNumber = result.accountsCollection.accounts.find(record => record.type === 'binckComplete').number;
              this.store.dispatch(new SetAccount({number: accountNumber}));
            });
        }
        this.access = access;
      });

    this.store
      .select('account')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(account => {
        if (!account.number) {
          console.log('!account.number');
          return;
        }
        if (!this.access.access_token) {
          console.log('!this.access.access_token');
          return;
        }

        if (this.accountNumber === account.number) {
          console.log('this.accountNumber === account.number: unchanged, going on to createRealTimeConnection()');
        } else {
          this.accountNumber = account.number;
          console.log('this.accountNumber return set:', this.accountNumber, account.number);
        }

        if (this.accountNumber) {
          this.createRealTimeConnection();
          this.getOrders();
        }
      });

    this.instrumentQuery.setValue('abn');

    hotkeys('alt+l,alt+r,alt+z,alt+x,alt+c', (event, handler) => {
      // Prevent the default refresh event under WINDOWS system
      event.preventDefault();
      switch (handler.key) {
        case 'alt+l':
          window.location.href = this.loginUrl;
          break;
        case 'alt+r':
          this.refreshBinckToken();
          break;
        case 'alt+z':
          this.onSubmitBuyOrder();
          break;
        case 'alt+x':
          this.onSubmitStopLossOrder();
          break;
        case 'alt+c':
          this.onSubmitSellOrder();
          break;
        default:
          alert(`you pressed ${handler.key}`);
          break;
      }
    });
    hotkeys.filter = (event) => {
      return true;
    };

    this.intervalId = setInterval(() => {
      this.refreshTokenAge();
    }, 1000);
  }

  refreshTokenAge() {
    if (this.lastTokenRefresh !== 0) {
      const newTokenAge = Math.round((Date.now() - this.lastTokenRefresh) / 1000);

      if (newTokenAge > 300) {
        this.refreshBinckToken();
      } else {
        this.tokenAge = newTokenAge;
      }
    }
  }

  refreshBinckToken() {
    this.apiService.refreshToken(this.access.access_token, this.access.refresh_token)
      .pipe(
        catchError(error => {
          this.error = error;
          return EMPTY;
        })
      )
      .subscribe(result => {
        this.store.dispatch(new SetAccess(result));
      });
  }

  ngOnDestroy(): void {
    this.unsubscribeRealTimeOrders();
    this.closeRealTimeConnection();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  getOrders() {
    console.log('getOrders()');
    this.orderService
      .getOrders(this.access.access_token, this.accountNumber)
      .pipe(
        catchError(error => {
          this.error = error;
          return EMPTY;
        })
      )
      .subscribe(result => {
        this.orders = result.ordersCollection.orders;
        console.log(this.orders);
      });
  }

  isCancellable(order: IOrder) {
    if (order.type === 'stop' && order.lastStatus === 'placementConfirmed') {
      return true;
    }
    return false;
  }

  instrumentQueryKeyUp($event) {
    if ($event.code === 'Enter') {
      $event.preventDefault();
      this.onInstrumentQuery(this.instrumentQuery.value);
    }
  }

  getTime(date: string): string {
    return date.replace(this.currentDateT, '');
  }

  flashLastStreamingTime() {
    this.lastStreamingTimeClass = 'badge badge-primary';
    clearInterval(this.lastStreamingTimeClassIntervalId);
    this.lastStreamingTimeClassIntervalId = setInterval(
      () => {
        this.lastStreamingTimeClass = 'badge badge-light';
        clearInterval(this.lastStreamingTimeClassIntervalId);
      },
      1000,
    );
  }

  createRealTimeConnection() {
    console.log('createRealTimeConnection()');
    if (this.connection.state === 1) {
      console.log('this.connection.stop();');
      this.connection.stop();
    }

    const theAccessToken = this.access.access_token;
    const options = {
      accessTokenFactory() {
        const accessToken = theAccessToken;
        console.log('AccessToken used in streamer request: ' + accessToken);
        return accessToken;
      }
    };

    console.log('createRealTimeConnection() going to create');
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('https://realtime.binck.com/stream/v1', options)
      .configureLogging(signalR.LogLevel.Information) // Might be 'Trace' for testing
      .build();

    this.connection.on('Quote', this.quoteNotification.bind(this));
    // this.connection.on('News', console.log);
    this.connection.on('OrderExecution', this.orderExecutionNotification.bind(this));
    this.connection.on('OrderModified', this.orderModifiedNotification.bind(this));
    this.connection.on('OrderStatus', this.orderStatusNotification.bind(this));
    this.connection.onclose(() => {
      this.connectionClosedCount.incValue();
      console.log('The connection has been closed.');
    });

    this.connection
      .start()
      .then(() => {
        console.log('The streamer has been started.');
        this.subscribeRealTimeOrders();
        this.subscribeRealTimeQuotes();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  quoteNotification(quote: IQuote) {
    this.lastStreamingTime = this.getTime(quote.sdt);
    this.flashLastStreamingTime();
    if (quote.id !== this.instrument.id) {
      return;
    }
    if (quote.lvl !== 1) {
      return;
    }
    quote.qt.forEach((qt) => {
      if (qt.msg === 'qu') {
        if (qt.typ === 'ask') {
          this.askPrice.setValue(qt.prc, this.getTime(qt.dt));
          this.updateOrders();
        } else if (qt.typ === 'bid') {
          this.bidPrice.setValue(qt.prc, this.getTime(qt.dt));
          this.updateOrders();
        }
      }
    });
  }

  orderExecutionNotification(order: any) {
    console.log('OrderExecution', order);
    this.toastr.info(`${order.number} ${order.status} ${order.avgprc || ''}`, 'OrderExecution');
    console.log(order.status, 'completelyExecuted', order.number, this.setStopLossOnBuyOrderNumber);
    if (order.status === 'completelyExecuted' && order.number === this.setStopLossOnBuyOrderNumber) {
      console.log('YES: this.onSubmitStopLossOrder() setStopLossOnBuyOrderNumber');
      this.onSubmitStopLossOrder();
    }
    this.getOrders();
  }

  orderModifiedNotification(order: any) {
    console.log('OrderModified', order);
    this.toastr.info(order, 'OrderModified');
    this.getOrders();
  }

  orderStatusNotification(order: any) {
    console.log('OrderStatus', order);
    this.toastr.info(`${order.number} ${order.status} ${order.limitPrice || ''}`, 'OrderStatus');
    this.getOrders();

    if (order.status === 'canceled' && order.number === this.setSellOrderOnStopLossCancelNumber) {
      console.log('YES: this.onSubmitStopLossOrder() setSellOrderOnStopLossCancelNumber');
      this.setSellOrderOnStopLossCancelNumber = 0;
      this.onSubmitSellOrder();
    }
  }

  // this.toastr.info(`${addedPartnerCount++} Partners added`, 'information');

  closeRealTimeConnection() {
    if (this.connection && this.connection.stop) {
      console.log('Closing the connection.');
      this.connection.stop()
        .then((result) => {
          console.log('connection.stop() success', result);
        })
        .catch((error) => {
          console.log('connection.stop() error', error);
        });
    }
  }

  subscribeRealTimeOrders() {
    if (!this.connection.invoke) {
      return;
    }
    this.connection.invoke('SubscribeOrders', this.accountNumber)
      .then((subscriptionResponse) => {
        if (subscriptionResponse.isSucceeded) {
          console.log('SubscribeOrders: Subscribed to the order updates feed.');
        } else {
          console.log('SubscribeOrders: Something went wrong. Is the accountNumber valid?');
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  unsubscribeRealTimeOrders() {
    if (!this.connection.invoke) {
      return;
    }
    this.connection.invoke('UnSubscribeOrders')
      .then((subscriptionResponse) => {
        if (subscriptionResponse.isSucceeded) {
          console.log('SubscribeOrders: unsubscribe succeeded');
        } else {
          // Internal issue - should never occur
          console.log('SubscribeOrders: unsubscribe failed');
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  subscribeRealTimeQuotes() {
    if (!this.connection.invoke) {
      return;
    }
    if (!this.instrument.id) {
      return;
    }
    this.connection.invoke('SubscribeQuotes', this.accountNumber, [this.instrument.id], 'Book')
      .then((subscriptionResponse) => {
        if (subscriptionResponse.isSucceeded) {
          console.log(`Quote subscribe succeeded, number of subscribed instruments is now: ${subscriptionResponse.subcount}`);
          this.currentlySubscribedInstrumentId = this.instrument.id;
        } else {
          console.log('SubscribeQuotes: Something went wrong. Is the accountNumber valid?');
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  unsubscribeRealTimeQuotes() {
    if (!this.connection.invoke) {
      return;
    }
    if (!this.currentlySubscribedInstrumentId) {
      return;
    }
    this.connection.invoke('UnSubscribeQuotes', [this.currentlySubscribedInstrumentId])
      .then((subscriptionResponse) => {
        if (subscriptionResponse.isSucceeded) {
          console.log(`Quote unsubscribe succeeded, number of subscribed instruments is now: ${subscriptionResponse.subcount}`);
          this.currentlySubscribedInstrumentId = '';
        } else {
          // Internal issue - should never occur
          console.log('Quote unsubscribe failed');
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  onInstrumentQuery(searchText: string) {
    if (!searchText || searchText.length < 2) {
      return;
    }
    this.unsubscribeRealTimeQuotes();
    this.instrument = {};
    this.instrumentService.findByName(this.access.access_token, this.accountNumber, searchText)
      .pipe(
        catchError(error => {
          this.error = error;
          return EMPTY;
        })
      )
      .subscribe(result => {
        if (result.count > 0) {
          this.instruments = result.instrumentsCollection
            .instruments
            .filter(instrument => ['EUR', 'USD'].includes(instrument.currency));
          this.instrumentCount = result.count;
          this.onInstrumentTableClick(0);
        }
      });
  }

  onInstrumentTableClick(index: number) {
    this.unsubscribeRealTimeQuotes();
    if (index >= this.instruments.length) {
      return;
    }
    this.instrument = this.instruments[index];
    this.currentAskPriceDecimals = this.instrument.priceDecimals;
    this.setForm(this.instrument);
    this.subscribeRealTimeQuotes();
    this.instrumentService.getQuotes(this.access.access_token, this.accountNumber, this.instrument.id)
      .pipe(
        catchError(error => {
          this.error = error;
          return EMPTY;
        })
      )
      .subscribe(result => {
        this.quotes = result;
        const quote = result.quotesCollection.quotes[0];
        this.quoteSubscriptionLevel = quote.subscriptionLevel;
        if (quote && quote.ask && quote.ask[0] && quote.ask[0].price) {
          this.askPrice.setValue(quote.ask[0].price, '');
        } else {
          this.askPrice.setValue(0, '');
        }
        if (quote && quote.bid && quote.bid[0] && quote.bid[0].price) {
          this.bidPrice.setValue(quote.bid[0].price, '');
        } else {
          this.bidPrice.setValue(0, '');
        }
        this.updateOrders();
      });
  }

  updateOrders() {
    this.getCurrentTickSize(this.askPrice.getValue());
    this.setLimitPrice();
    this.setStopPrice();
    this.setSpread();
    this.setMaxLoss();
  }

  onDeselect() {
    this.unsubscribeRealTimeQuotes();
    this.instrument = {};
  }

  getCurrentTickSize(price: number) {
    let size = 0;
    this.instrument.tickSizeCollection.tickSizes.some(tickSize => {
      if (price >= tickSize.from) {
        size = tickSize.size;
        return false;
      }
      return true;
    });
    this.currentTickSize = size;
  }

  setMaxLoss() {
    if (this.askPrice.getValue() === 0 && this.bidPrice.getValue() === 0) {
      return;
    }
    const formValues = this.orderForm.getRawValue();
    const buy = new Decimal(this.askPrice.getValue() * formValues.quantity);
    const sell = new Decimal(formValues.stopPrice * formValues.quantity);
    this.totalBuy.setValue(buy.toDecimalPlaces(this.currentAskPriceDecimals).toNumber(), '');
    this.totalSell.setValue(sell.toDecimalPlaces(this.currentAskPriceDecimals).toNumber(), '');
    this.maxLoss.setValue(buy.minus(sell).toDecimalPlaces(this.currentAskPriceDecimals).toNumber(), '');
  }

  setSpread() {
    if (this.askPrice.getValue() === 0 && this.bidPrice.getValue() === 0) {
      return;
    }
    const spread1 = new Decimal(this.askPrice.getValue() - this.bidPrice.getValue());
    const spread2 = spread1.toDecimalPlaces(this.currentAskPriceDecimals);
    this.priceSpread.setValue(spread2.toNumber(), '');
    const perc1 = spread2.mul(new Decimal(100)).div(new Decimal(this.askPrice.getValue()));
    this.priceSpreadPercentage.setValue(perc1.toDecimalPlaces(3).toNumber(), '');
  }

  setLimitPrice() {
    const limitPrice = this.getLimitPrice(this.askPrice.getValue());
    this.orderForm.patchValue({
      limitPrice,
    });
  }

  getLimitPrice(currentAskPrice: number): number {
    const originalPrice = new Decimal(currentAskPrice);
    const factor = new Decimal(1).add(new Decimal(this.orderForm.getRawValue().addPercentage).div(new Decimal(100)));
    const price = originalPrice.times(factor).toNearest(this.currentTickSize).toDecimalPlaces(this.currentAskPriceDecimals);
    this.currentAddToPrice = price.minus(originalPrice).toNumber();
    return price.toNumber();
  }

  onAddPercentageChange() {
    this.setLimitPrice();
  }

  setStopPrice() {
    const stopPrice = this.getStopPrice(this.bidPrice.getValue());
    this.orderForm.patchValue({
      stopPrice,
    });
  }

  getStopPrice(currentBidPrice: number): number {
    const originalPrice = new Decimal(currentBidPrice);
    const factor = new Decimal(1).minus(new Decimal(this.orderForm.getRawValue().minusPercentage).div(new Decimal(100)));
    const price = originalPrice.times(factor).toNearest(this.currentTickSize).toDecimalPlaces(this.currentAskPriceDecimals);
    this.currentSubtractFromPrice = price.minus(originalPrice).toNumber();
    return price.toNumber();
  }

  onMinusPercentageChange() {
    this.setStopPrice();
  }

  setForm(instrument: any) {
    this.orderForm.setValue({
      instrumentId: instrument.id,
      quantity: 100,
      addPercentage: 0.5,
      limitPrice: 0,
      minusPercentage: 0.5,
      stopPrice: 0,
    });
  }

  onSubmitBuyAndStopLossOrder() {
    this.onSubmitBuyOrder('createStopLossOrder');
  }

  onSubmitBuyOrder(onSuccess: string = 'NOP') {
    this.validateResult = undefined;
    this.placeResult = undefined;
    this.error = undefined;
    this.setStopLossOnBuyOrderNumber = 0;
    if (!this.instrument.id) {
      return;
    }
    const formValues = this.orderForm.getRawValue();
    const newOrder = this.createBuyOrder(formValues.instrumentId, formValues.quantity, formValues.limitPrice);
    console.log(newOrder);
    this.orderService.validateNewOrder(this.access.access_token, this.accountNumber, newOrder)
      .pipe(
        catchError(error => {
          this.error = error;
          return EMPTY;
        })
      )
      .subscribe(validateResult => {
        this.validateResult = validateResult;
        if (validateResult.previewOrder.orderCanBeRegistered) {
          newOrder.validationCode = validateResult.previewOrder.validationCode;
          this.orderService.placeOrder(this.access.access_token, this.accountNumber, newOrder)
            .pipe(
              catchError(error => {
                this.error = error;
                return EMPTY;
              })
            )
            .subscribe(placeResult => {
              this.placeResult = placeResult;
              this.buyOrderNumber = placeResult.ordersCollection.orders[0].number;
              this.setStopLossOnBuyOrderNumber = 0;
              if (onSuccess === 'createStopLossOrder') {
                this.setStopLossOnBuyOrderNumber = this.buyOrderNumber;
              }
            });
        }
      });
  }

  createBuyOrder(instrumentId: string, quantity: number, limitPrice: number): INewOrder {
    return {
      type: 'limit',
      quantity,
      duration: 'day',
      limitPrice,
      cash: {
        side: 'buy',
        instrumentId,
      },
      referenceId: Date.now().toString(),
    };
  }

  onSubmitStopLossOrder() {
    this.validateResult = undefined;
    this.placeResult = undefined;
    this.error = undefined;
    this.setStopLossOnBuyOrderNumber = 0;
    if (!this.instrument.id) {
      return;
    }
    const formValues = this.orderForm.getRawValue();
    const newOrder = this.createStopLossOrder(formValues.instrumentId, formValues.quantity, formValues.stopPrice);
    console.log(newOrder);
    this.orderService.validateNewOrder(this.access.access_token, this.accountNumber, newOrder)
      .pipe(
        catchError(error => {
          this.error = error;
          return EMPTY;
        })
      )
      .subscribe(validateResult => {
        this.validateResult = validateResult;
        if (validateResult.previewOrder.orderCanBeRegistered) {
          newOrder.validationCode = validateResult.previewOrder.validationCode;
          this.orderService.placeOrder(this.access.access_token, this.accountNumber, newOrder)
            .pipe(
              catchError(error => {
                this.error = error;
                return EMPTY;
              })
            )
            .subscribe(placeResult => {
              this.placeResult = placeResult;
              this.stopLossOrderNumber = placeResult.ordersCollection.orders[0].number;
            });
        }
      });
  }

  createStopLossOrder(instrumentId: string, quantity: number, stopPrice: number): INewOrder {
    return {
      type: 'stop',
      quantity,
      duration: 'day',
      stopPrice,
      cash: {
        side: 'sell',
        instrumentId,
      },
      referenceId: Date.now().toString(),
    };
  }

  onSubmitCancelOrder(orderNumber: number) {
    if (!orderNumber) {
      return;
    }
    console.log(`onSubmitCancelOrder ${orderNumber}`);

    this.validateResult = undefined;
    this.placeResult = undefined;
    this.error = undefined;
    this.orderService.cancelOrder(this.access.access_token, this.accountNumber, orderNumber)
      .pipe(
        catchError(error => {
          this.error = error;
          return EMPTY;
        })
      )
      .subscribe(placeResult => {
        this.placeResult = placeResult;
      });
  }

  onSubmitCancelAndSellOrder() {
    if (this.stopLossOrderNumber > 0) {
      console.log(`AAAA ${this.stopLossOrderNumber}`);
      this.setSellOrderOnStopLossCancelNumber = this.stopLossOrderNumber;
      this.stopLossOrderNumber = 0;
      this.onSubmitCancelOrder(this.setSellOrderOnStopLossCancelNumber);
    } else {
      this.onSubmitSellOrder();
    }

  }

  onSubmitSellOrder() {
    this.validateResult = undefined;
    this.placeResult = undefined;
    this.error = undefined;
    if (!this.instrument.id) {
      return;
    }

    this.setSellOrderOnStopLossCancelNumber = 0;
    const formValues = this.orderForm.getRawValue();
    const newOrder = this.createSellOrder(formValues.instrumentId, formValues.quantity);
    console.log(newOrder);
    this.orderService.validateNewOrder(this.access.access_token, this.accountNumber, newOrder)
      .pipe(
        catchError(error => {
          this.error = error;
          return EMPTY;
        })
      )
      .subscribe(validateResult => {
        this.validateResult = validateResult;
        if (validateResult.previewOrder.orderCanBeRegistered) {
          newOrder.validationCode = validateResult.previewOrder.validationCode;
          this.orderService.placeOrder(this.access.access_token, this.accountNumber, newOrder)
            .pipe(
              catchError(error => {
                this.error = error;
                return EMPTY;
              })
            )
            .subscribe(placeResult => {
              this.placeResult = placeResult;
              this.sellOrderNumber = placeResult.ordersCollection.orders[0].number;
            });
        }
      });
  }

  createSellOrder(instrumentId: string, quantity: number): INewOrder {
    return {
      type: 'market',
      quantity,
      duration: 'day',
      cash: {
        side: 'sell',
        instrumentId,
      },
      referenceId: Date.now().toString(),
    };
  }
}
