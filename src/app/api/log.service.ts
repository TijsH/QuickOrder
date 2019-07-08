import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  readonly baseUrl = 'http://localhost:81/log';
  readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json; charset=utf-8',
      Accept: 'application/json; charset=utf-8',
      Authorization: `Bearer TO_BE_DONE`,
    })
  };

  constructor(private http: HttpClient) {
  }

  public log(logFile: string, action: string, body: object) {
    const message = JSON.stringify(body);
    return this.http
      .post<any>(this.baseUrl, {environment: 'TBD', logFile, action, message}, this.httpOptions)
      .subscribe();
  }
}
