import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  readonly state = 'asdgfhjwetrbxcv35761234sdgfh';
  // readonly redirectUrl = encodeURIComponent('http://localhost:4200/binck');
  readonly redirectUrl = 'http://localhost:4200/binck';

  constructor(private http: HttpClient) {
  }

  public getLoginUrl(): string {
    console.log(encodeURIComponent(this.redirectUrl));

    const baseUrl = 'https://login.binck.com/am/oauth2/realms/bincknlapi/authorize?';

    let params = new HttpParams();
    params = params.set('ui_locales', 'nl');
    params = params.set('client_id', 'IndividualUser_Zartras_hJf4h56fesGhwDwe');
    params = params.set('scope', 'read write quotes news');
    params = params.set('state', this.state);
    params = params.set('response_type', 'code');
    // params = params.set('redirect_uri', this.redirectUrl);
    return baseUrl + params.toString() + '&redirect_uri=' + this.redirectUrl;
  }

  public getAccessToken(authorizationCode: string): Observable<any> {
    const baseUrl = 'https://login.binck.com/am/oauth2/realms/bincknlapi/access_token';
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      })
    };
    let params = new HttpParams();
    params = params.set('grant_type', 'authorization_code');
    params = params.set('client_id', 'IndividualUser_Zartras_hJf4h56fesGhwDwe');
    params = params.set('client_secret', '5HjshhaQcrmpJHfr75f477562fre');
    params = params.set('redirect_uri', this.redirectUrl);
    params = params.set('code', authorizationCode);

    return this.http
      .post<any>(baseUrl, params, httpOptions);
  }

  public refreshToken(accessToken: string, refreshToken: string): Observable<any> {
    const baseUrl = 'https://login.binck.com/am/oauth2/realms/bincknlapi/access_token';
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      })
    };
    let params = new HttpParams();
    params = params.set('grant_type', 'refresh_token');
    params = params.set('client_id', 'IndividualUser_Zartras_hJf4h56fesGhwDwe');
    params = params.set('client_secret', '5HjshhaQcrmpJHfr75f477562fre');
    params = params.set('refresh_token', refreshToken);

    return this.http
      .post<any>(baseUrl, params, httpOptions);
  }

  public getApiVersion(accessToken: string): Observable<any> {
    const baseUrl = 'https://api.binck.com/api/v1/version';
    const httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json; charset=utf-8',
        Authorization: `Bearer ${accessToken}`,
      })
    };
    return this.http
      .get<any>(baseUrl, httpOptions);
  }

  public getAccounts(accessToken: string): Observable<any> {
    const baseUrl = 'https://api.binck.com/api/v1/accounts';
    const httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json; charset=utf-8',
        Authorization: `Bearer ${accessToken}`,
      })
    };
    return this.http
      .get<any>(baseUrl, httpOptions);
  }
}
