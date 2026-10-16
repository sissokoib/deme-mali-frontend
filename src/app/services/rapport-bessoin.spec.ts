import { TestBed } from '@angular/core/testing';

import { RapportBessoin } from './rapport-bessoin';

describe('RapportBessoin', () => {
  let service: RapportBessoin;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RapportBessoin);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
