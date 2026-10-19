import { TestBed } from '@angular/core/testing';

import { PreuveDistributionService } from './preuve-distribution.service';

describe('PreuveDistributionService', () => {
  let service: PreuveDistributionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PreuveDistributionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
