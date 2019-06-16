import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {select, Store} from '@ngrx/store';
import hotkeys from 'hotkeys-js';
import {IAppState} from '../store/app.state';
import {IAccess} from '../store/access.model';
import {InstrumentService} from '../api/instrument.service';
import {catchError, takeUntil} from 'rxjs/operators';
import {EMPTY, Subject} from 'rxjs';
import {Decimal} from 'decimal.js';
import {INewOrder} from '../api/order.model';
import {OrderService} from '../api/order.service';
import * as signalR from '@aspnet/signalr';
import {ApiService} from '../api/api.service';
import {SetAccess} from '../store/access.actions';
import {SetAccount} from '../store/account.actions';
import {Router} from '@angular/router';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent implements OnInit, OnDestroy {
  private loginUrl: string;
  private lastTokenRefresh = 0;
  private intervalId: any;
  private tokenAge: number;
  private apiVersion: any = {};
  private access: IAccess;
  private accountNumber = '';
  private instruments = [];
  private instrument: any = {};
  private currentTickSize = 0.0001;
  private currentAddToPrice = 0;
  private currentSubtractFromPrice = 0;
  private currentAskPrice = 0;
  private currentBidPrice = 0;
  private currentAskPriceDecimals = 4;
  private quotes: any = {};
  private instrumentCount = 0;
  private message: any;
  private error: any;
  private validateResult: any;
  private placeResult: any;
  private instrumentQuery = new FormControl('');
  private connection: any = {};
  private currentlySubscribedInstrumentId: string;

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
              private apiService: ApiService,
              private instrumentService: InstrumentService,
              private orderService: OrderService) {
  }

  // https://stackoverflow.com/questions/38008334/angular-rxjs-when-should-i-unsubscribe-from-subscription
  private ngUnsubscribe = new Subject();

  ngOnInit() {
    console.log('ngOnInit');
    this.loginUrl = this.apiService.getLoginUrl();

    const BinkState$ = this.store.pipe(select('access'));
    BinkState$
      .subscribe(access => {
        if (access.access_token && (!this.access || !this.access.access_token || this.access.access_token !== access.access_token)) {
          this.lastTokenRefresh = Date.now();
          this.tokenAge = 0;
        }
        this.access = access;
        if (access.access_token) {
          this.apiService
            .getApiVersion(access.access_token)
            .pipe(
              catchError(error => {
                this.error = error;
                return EMPTY;
              })
            )
            .subscribe(result => {
              this.apiVersion = result;
            });
          this.apiService
            .getAccounts(access.access_token)
            .pipe(
              catchError(error => {
                this.error = error;
                return EMPTY;
              })
            )
            .subscribe(result => {
              this.accountNumber = result.accountsCollection.accounts.find(record => record.type === 'binckComplete').number;
              this.store.dispatch(new SetAccount({number: this.accountNumber}));
            });
        }
      });

    this.store
      .select('access')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(access => {
        this.access = access;
      });
    this.store
      .select('account')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(account => {
        this.accountNumber = account.number;
      });

    this.instrumentQuery.setValue('abn');
    this.createRealTimeConnection();

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

      if (newTokenAge > 600) {
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

        this.connection.invoke('ExtendSubscriptions', result.access_token)
          .then(() => {
            console.log('RealTimeConnection extended.');
          })
          .catch((error) => {
            console.error(error);
          });
      });
  }

  ngOnDestroy(): void {
    this.closeRealTimeConnection();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  instrumentQueryKeyUp($event) {
    if ($event.code === 'Enter') {
      $event.preventDefault();
      if (this.instrumentQuery.value && this.instrumentQuery.value.length >= 2) {
        this.onInstrumentQuery(this.instrumentQuery.value);
      }
    }
  }

  createRealTimeConnection() {
    const theAccessToken = this.access.access_token;
    const options = {
      accessTokenFactory() {
        const accessToken = theAccessToken;
        console.log('AccessToken used in streamer request: ' + accessToken);
        return accessToken;
      }
    };
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('https://realtime.sandbox.binck.com/stream/v1', options)
      .configureLogging(signalR.LogLevel.Information) // Might be 'Trace' for testing
      .build();

    this.connection.on('Quote', console.log);
    // this.connection.on('News', console.log);
    // this.connection.on('OrderExecution', console.log);
    // this.connection.on('OrderModified', console.log);
    // this.connection.on('OrderStatus', console.log);
    this.connection.onclose(() => {
      console.log('The connection has been closed.');
    });

    this.connection
      .start()
      .then(() => {
        console.log('The streamer has been started.');
      })
      .catch((error) => {
        console.error(error);
      });
  }

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

  subscribeRealTimeQuotes(instrumentId: string) {
    this.connection.invoke('SubscribeQuotes', this.accountNumber, [instrumentId], 'Book')
      .then((subscriptionResponse) => {
        if (subscriptionResponse.isSucceeded) {
          console.log(`Quote subscribe succeeded, number of subscribed instruments is now: ${subscriptionResponse.subcount}`);
          this.currentlySubscribedInstrumentId = instrumentId;
        } else {
          console.log('SubscribeQuotes: Something went wrong. Is the accountNumber valid?');
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  unsubscribeRealTimeQuotes(instrumentId: string) {
    if (!instrumentId) {
      return;
    }
    this.connection.invoke('UnSubscribeQuotes', [instrumentId])
      .then((subscriptionResponse) => {
        if (subscriptionResponse.isSucceeded) {
          console.log(`Quote unsubscribe succeeded, number of subscribed instruments is now: ${subscriptionResponse.subcount}`);
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
            .filter(instrument => instrument.tickerSymbol && ['EUR', 'USD'].includes(instrument.currency));
          this.instrumentCount = result.count;
          this.onInstrumentTableClick(0);
        }
      });
  }

  onInstrumentTableClick(index: number) {
    this.unsubscribeRealTimeQuotes(this.currentlySubscribedInstrumentId);
    this.instrument = this.instruments[index];
    this.currentAskPriceDecimals = this.instrument.priceDecimals;
    this.setForm(this.instrument);
    this.subscribeRealTimeQuotes(this.instrument.id);
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
        this.currentAskPrice = (quote.last || quote.close || {price: 0}).price;
        this.currentBidPrice = (quote.last || quote.close || {price: 0}).price;
        this.getCurrentTickSize(this.currentAskPrice);
        this.setLimitPrice();
        this.setStopPrice();
      });
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

  setLimitPrice() {
    this.orderForm.patchValue({
      limitPrice: this.getLimitPrice(this.currentAskPrice),
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
    this.orderForm.patchValue({
      stopPrice: this.getStopPrice(this.currentBidPrice),
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

  onSubmitBuyOrder() {
    this.placeResult = undefined;
    this.error = undefined;
    if (!this.instrument.id) {
      return;
    }
    const formValues = this.orderForm.getRawValue();
    const newOrder = this.createBuyOrder(formValues.instrumentId, formValues.quantity, formValues.limitPrice);
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
    this.placeResult = undefined;
    this.error = undefined;
    if (!this.instrument.id) {
      return;
    }
    const formValues = this.orderForm.getRawValue();
    const newOrder = this.createStopLossOrder(formValues.instrumentId, formValues.quantity, formValues.limitPrice);
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

  onSubmitSellOrder() {
    this.placeResult = undefined;
    this.error = undefined;
    if (!this.instrument.id) {
      return;
    }
    const formValues = this.orderForm.getRawValue();
    const newOrder = this.createSellOrder(formValues.instrumentId, formValues.quantity);
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
