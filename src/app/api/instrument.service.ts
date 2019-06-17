import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InstrumentService {
  constructor(private http: HttpClient) {
  }

  public findByName(accessToken: string, accountNumber: string, searchText: string): Observable<any> {
    const baseUrl = 'https://api.binck.com/api/v1/instruments';
    let params = new HttpParams();
    params = params.set('includeTickSizes', 'true');
    params = params.set('accountNumber', accountNumber);
    params = params.set('instrumentType', 'equity');
    params = params.set('searchText', searchText);
    params = params.set('range', '0-19');

    const httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json; charset=utf-8',
        Authorization: `Bearer ${accessToken}`,
      }),
      params,
    };
    return this.http
      .get<any>(baseUrl, httpOptions);
  }

  public getQuotes(accessToken: string, accountNumber: string, instrumentId: string): Observable<any> {
    const baseUrl = 'https://api.binck.com/api/v1/quotes';
    let params = new HttpParams();
    params = params.set('accountNumber', accountNumber);
    params = params.set('instrumentIds', instrumentId);
    params = params.set('level', 'fullBook');
    params = params.set('range', '0-0');

    const httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json; charset=utf-8',
        Authorization: `Bearer ${accessToken}`,
      }),
      params,
    };
    return this.http
      .get<any>(baseUrl, httpOptions);
  }
}
