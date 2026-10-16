import { TestBed } from '@angular/core/testing';

import { AffectationDonMateriel } from './affectation-don-materiel';

describe('AffectationDonMateriel', () => {
  let service: AffectationDonMateriel;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AffectationDonMateriel);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
