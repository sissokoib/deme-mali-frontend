import { TestBed } from '@angular/core/testing';

import { Beneficiaire } from './beneficiaire';

describe('Beneficiaire', () => {
  let service: Beneficiaire;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Beneficiaire);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
