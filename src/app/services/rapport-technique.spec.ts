import { TestBed } from '@angular/core/testing';

import { RapportTechnique } from './rapport-technique';

describe('RapportTechnique', () => {
  let service: RapportTechnique;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RapportTechnique);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
