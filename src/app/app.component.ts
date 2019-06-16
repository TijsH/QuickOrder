import {Component, OnInit} from '@angular/core';
import {ApiService} from './api/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'quick-order';
  private loginUrl: string;

  constructor(private apiService: ApiService,
  ) {
  }

  ngOnInit() {
    this.loginUrl = this.apiService.getLoginUrl();
  }
}
