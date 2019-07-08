import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ToastrModule} from 'ngx-toastr';
import {StrategyService} from './strategy.service';


describe('StrategyService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      HttpClientTestingModule,
      ToastrModule.forRoot({
        closeButton: true,
        progressBar: true,
        timeOut: 3000,
      })
    ]
  }));

  it('should be created', () => {
    const service: StrategyService = TestBed.get(StrategyService);
    expect(service).toBeTruthy();
  });

  it('should return time as HHmmssSSS', () => {
    expect(StrategyService.getTimeForReferenceId()).toMatch(/^[0-2]\d[0-5]\d[0-5]\d\d{3}$/);
  });
});
