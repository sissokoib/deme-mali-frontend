import { TestBed } from '@angular/core/testing';

import { AttributionDon } from './attribution-don';

describe('AttributionDon', () => {
  let service: AttributionDon;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AttributionDon);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
