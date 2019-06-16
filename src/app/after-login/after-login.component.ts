import {Router} from '@angular/router';
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ApiService} from '../api/api.service';
import {select, Store} from '@ngrx/store';
import {IAppState} from '../store/app.state';
import {EMPTY, Observable} from 'rxjs';
import {SetAccess} from '../store/access.actions';
import {catchError} from 'rxjs/operators';

@Component({
  selector: 'app-after-login',
  templateUrl: './after-login.component.html',
  styleUrls: ['./after-login.component.css']
})
export class AfterLoginComponent implements OnInit {
  loginParams: any;
  error: any;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private apiService: ApiService,
              private store: Store<IAppState>
  ) {
  }

  AppState$: Observable<IAppState>;

  ngOnInit() {
    this.AppState$ = this.store.pipe(select('binck'));

    this.loginParams = {};
    this.error = {};

    this.route.queryParams
      .subscribe(params => {
        this.loginParams = params;
        this.apiService.getAccessToken(params.code)
          .pipe(
            catchError(error => {
              this.error = error;
              return EMPTY;
            })
          )
          .subscribe(result => {
            this.store.dispatch(new SetAccess(result));
            // noinspection JSIgnoredPromiseFromCall
            this.router.navigateByUrl('/order');
          });
      });
  }
}
