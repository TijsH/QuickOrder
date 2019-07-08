import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {InstrumentService} from './instrument.service';

describe('InstrumentService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule]
  }));

  it('should be created', () => {
    const service: InstrumentService = TestBed.get(InstrumentService);
    expect(service).toBeTruthy();
  });
});
