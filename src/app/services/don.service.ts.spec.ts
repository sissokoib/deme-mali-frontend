import { TestBed } from '@angular/core/testing';

import { DonServiceTs } from './don.service.ts';

describe('DonServiceTs', () => {
  let service: DonServiceTs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DonServiceTs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
