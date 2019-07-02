import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  constructor(private http: HttpClient) {
  }

  public log(stream: string, message: string) {
    console.log('public log(message: string): Observable<any>');
    const baseUrl = 'http://localhost:81/log';
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json; charset=utf-8',
        Authorization: `Bearer TO_BE_DONE`,
      })
    };

    return this.http
      .post<any>(baseUrl, {environment: 'TBD', stream, message}, httpOptions)
      .subscribe();
  }
}
