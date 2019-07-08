import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {AfterLoginComponent} from './after-login.component';
import {StoreModule} from '@ngrx/store';
import {reducers} from '../store/reducers';
import {RouterModule} from '@angular/router';

describe('AfterLoginComponent', () => {
  let component: AfterLoginComponent;
  let fixture: ComponentFixture<AfterLoginComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AfterLoginComponent],
      providers: [
        //   ActivatedRoute
      ],
      imports: [
        HttpClientTestingModule,
        RouterModule.forRoot([]),
        StoreModule.forRoot(reducers)
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AfterLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
