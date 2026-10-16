import { TestBed } from '@angular/core/testing';

import { AidesDistribuees } from './aides-distribuees';

describe('AidesDistribuees', () => {
  let service: AidesDistribuees;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AidesDistribuees);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
