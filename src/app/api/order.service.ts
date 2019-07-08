import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {EMPTY, Observable} from 'rxjs';
import {INewOrder} from './newOrder.model';
import {catchError, tap} from 'rxjs/operators';
import {LogService} from './log.service';
import {ToastrService} from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(private http: HttpClient,
              private logService: LogService,
              private toastr: ToastrService) {
  }

  public getOrders(accessToken: string, accountNumber: string): Observable<any> {
    const baseUrl = `https://api.binck.com/api/v1/accounts/${accountNumber}/orders?range=0-19&status=all`;
    const httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json; charset=utf-8',
        Authorization: `Bearer ${accessToken}`,
      })
    };
    this.logService.log('Orders', 'getOrders Start', {accountNumber});
    return this.http
      .get<any>(baseUrl, httpOptions)
      .pipe(
        tap(value => this.logService.log('Orders', 'getOrders Result', value)),
        catchError(error => {
          this.logService.log('Orders', 'getOrders Error', error);
          this.toastr.error(error.error.developerMessage, 'Orders - getOrders Error');
          return EMPTY;
        })
      );
  }

  public validateNewOrder(accessToken: string, accountNumber: string, newOrder: INewOrder): Observable<any> {
    const baseUrl = `https://api.binck.com/api/v1/accounts/${accountNumber}/orders/preview`;
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json; charset=utf-8',
        Authorization: `Bearer ${accessToken}`,
      })
    };

    this.logService.log('Orders', 'validateNewOrder Start', newOrder);
    return this.http
      .post<any>(baseUrl, newOrder, httpOptions)
      .pipe(
        tap(value => this.logService.log('Orders', 'validateNewOrder Result', value)),
        catchError(error => {
          this.logService.log('Orders', 'validateNewOrder Error', error);
          this.toastr.error(error.error.developerMessage, 'Orders - validateNewOrder Error');
          return EMPTY;
        })
      );
  }

  public placeOrder(accessToken: string, accountNumber: string, newOrder: INewOrder): Observable<any> {
    const baseUrl = `https://api.binck.com/api/v1/accounts/${accountNumber}/orders`;
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json; charset=utf-8',
        Authorization: `Bearer ${accessToken}`,
      })
    };

    this.logService.log('Orders', 'placeOrder Start', newOrder);
    return this.http
      .post<any>(baseUrl, newOrder, httpOptions)
      .pipe(
        tap(value => this.logService.log('Orders', 'placeOrder Result', value)),
        catchError(error => {
          this.logService.log('Orders', 'placeOrder Error', error);
          this.toastr.error(error.error.developerMessage, 'Orders - placeOrder Error');
          return EMPTY;
        })
      );
  }

  public cancelOrder(accessToken: string, accountNumber: string, orderNumber: number): Observable<any> {
    const baseUrl = `https://api.binck.com/api/v1/accounts/${accountNumber}/orders/${orderNumber}`;
    const httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json; charset=utf-8',
        Authorization: `Bearer ${accessToken}`,
      })
    };

    this.logService.log('Orders', 'cancelOrder Start', {orderNumber});
    return this.http
      .delete<any>(baseUrl, httpOptions)
      .pipe(
        tap(value => this.logService.log('Orders', 'cancelOrder Result', value)),
        catchError(error => {
          this.logService.log('Orders', 'cancelOrder Error', error);
          this.toastr.error(error.error.developerMessage, 'Orders - cancelOrder Error');
          return EMPTY;
        })
      );
  }
}
