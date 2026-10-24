import { TestBed } from '@angular/core/testing';

import { ImageDemandeService } from './image-demande.service';

describe('ImageDemandeService', () => {
  let service: ImageDemandeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageDemandeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
