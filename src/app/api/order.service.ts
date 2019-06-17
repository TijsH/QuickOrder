import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {INewOrder} from './order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(private http: HttpClient) {
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
}
