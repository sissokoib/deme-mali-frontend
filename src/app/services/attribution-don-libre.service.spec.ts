import { TestBed } from '@angular/core/testing';

import { AttributionDonLibreService } from './attribution-don-libre.service';

describe('AttributionDonLibreService', () => {
  let service: AttributionDonLibreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AttributionDonLibreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
