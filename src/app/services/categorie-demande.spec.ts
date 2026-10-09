import { TestBed } from '@angular/core/testing';

import { CategorieDemande } from './categorie-demande';

describe('CategorieDemande', () => {
  let service: CategorieDemande;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategorieDemande);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
