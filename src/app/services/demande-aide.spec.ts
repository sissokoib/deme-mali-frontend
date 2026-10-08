import { TestBed } from '@angular/core/testing';

import { DemandeAide } from './demande-aide';

describe('DemandeAide', () => {
  let service: DemandeAide;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DemandeAide);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
