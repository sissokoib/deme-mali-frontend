import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EtudeTerrain } from './etude-terrain';

describe('EtudeTerrain', () => {
  let component: EtudeTerrain;
  let fixture: ComponentFixture<EtudeTerrain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EtudeTerrain],
    }).compileComponents();

    fixture = TestBed.createComponent(EtudeTerrain);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
