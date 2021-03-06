import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import {ReactiveFormsModule} from '@angular/forms';
import {ToastrModule} from 'ngx-toastr';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {AfterLoginComponent} from './after-login/after-login.component';
import {NavbarComponent} from './navbar/navbar.component';
import {StoreModule} from '@ngrx/store';
import {environment} from '../environments/environment';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {HomeComponent} from './home/home.component';
import {OrderComponent} from './order/order.component';
import {reducers} from './store/reducers';

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
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    StoreModule.forRoot(reducers),
    StoreDevtoolsModule.instrument({
      maxAge: 10, // Retains last 10 states
      logOnly: environment.production, // Restrict extension to log-only mode
    }),
    ToastrModule.forRoot({
      closeButton: true,
      progressBar: true,
      timeOut: 3000,
    })
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule {
}
