import { TestBed } from '@angular/core/testing';

import { AffectationDon } from './affectation-don';

describe('AffectationDon', () => {
  let service: AffectationDon;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AffectationDon);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
