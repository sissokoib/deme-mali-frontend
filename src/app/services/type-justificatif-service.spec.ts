import { TestBed } from '@angular/core/testing';

import { TypeJustificatifService } from './type-justificatif-service';

describe('TypeJustificatifService', () => {
  let service: TypeJustificatifService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TypeJustificatifService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
