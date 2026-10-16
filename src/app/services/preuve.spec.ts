import { TestBed } from '@angular/core/testing';

import { Preuve } from './preuve';

describe('Preuve', () => {
  let service: Preuve;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Preuve);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
