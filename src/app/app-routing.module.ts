import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AfterLoginComponent} from './after-login/after-login.component';
import {HomeComponent} from './home/home.component';
import {OrderComponent} from './order/order.component';

const routes: Routes = [
  {path: '', redirectTo: '/order', pathMatch: 'full'},
  {path: 'binck', component: AfterLoginComponent}, // No nav bar entry, called by Binck.nl
  {path: 'home', component: HomeComponent},
  {path: 'order', component: OrderComponent},
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: false, // no hash in the url
      enableTracing: false, // for debugging purposes only
    }),
  ], // no html5 mode for webMethods
  exports: [
    RouterModule,
  ]
})
export class AppRoutingModule {
}
