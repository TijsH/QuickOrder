import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import {ReactiveFormsModule} from '@angular/forms';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {AfterLoginComponent} from './after-login/after-login.component';
import {NavbarComponent} from './navbar/navbar.component';
import {StoreModule} from '@ngrx/store';
import {AccessReducer} from './store/access.reducer';
import {environment} from '../environments/environment';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {HomeComponent} from './home/home.component';
import {AccountReducer} from './store/account.reducer';
import {OrderComponent} from './order/order.component';

@NgModule({
  declarations: [
    AppComponent,
    AfterLoginComponent,
    NavbarComponent,
    HomeComponent,
    OrderComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    StoreModule.forRoot({access: AccessReducer, account: AccountReducer}),
    StoreDevtoolsModule.instrument({
      maxAge: 10, // Retains last 10 states
      logOnly: environment.production, // Restrict extension to log-only mode
    }),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
