import {Component, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {IAppState} from '../store/app.state';
import {EMPTY, Observable} from 'rxjs';
import {ApiService} from '../api/api.service';
import {catchError} from 'rxjs/operators';
import {IAccess} from '../store/access.model';
import {SetAccess} from '../store/access.actions';
import {SetAccount} from '../store/account.actions';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private access: IAccess = {};
  private loginUrl: string;
  private error: { error: { error: string } };
  private apiVersion: any = {};
  private accounts: any = {};
  private accountNumber = '';


  constructor(private store: Store<IAppState>,
              private apiService: ApiService) {
  }

  ngOnInit() {
    this.loginUrl = this.apiService.getLoginUrl();

    const BinkState$ = this.store.pipe(select('access'));
    BinkState$
      .subscribe(access => {
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
              this.accounts = result;
              this.accountNumber = result.accountsCollection.accounts.find(record => record.type === 'binckComplete').number;
              this.store.dispatch(new SetAccount({number: this.accountNumber}));
            });
        }
      });
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

}
