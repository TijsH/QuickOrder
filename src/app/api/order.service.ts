import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {INewOrder} from './newOrder.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(private http: HttpClient) {
  }

  public getOrders(accessToken: string, accountNumber: string): Observable<any> {
    const baseUrl = `https://api.binck.com/api/v1/accounts/${accountNumber}/orders?range=0-19&status=all`;
    const httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json; charset=utf-8',
        Authorization: `Bearer ${accessToken}`,
      })
    };
    return this.http
      .get<any>(baseUrl, httpOptions);
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

    return this.http
      .post<any>(baseUrl, newOrder, httpOptions);
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

    return this.http
      .post<any>(baseUrl, newOrder, httpOptions);
  }

  public cancelOrder(accessToken: string, accountNumber: string, orderNumber: number): Observable<any> {
    const baseUrl = `https://api.binck.com/api/v1/accounts/${accountNumber}/orders/${orderNumber}`;
    const httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json; charset=utf-8',
        Authorization: `Bearer ${accessToken}`,
      })
    };

    return this.http
      .delete<any>(baseUrl, httpOptions);
  }
}
