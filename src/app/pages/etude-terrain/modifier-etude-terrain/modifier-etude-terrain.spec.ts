import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifierEtudeTerrain } from './modifier-etude-terrain';

describe('ModifierEtudeTerrain', () => {
  let component: ModifierEtudeTerrain;
  let fixture: ComponentFixture<ModifierEtudeTerrain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifierEtudeTerrain],
    }).compileComponents();

    fixture = TestBed.createComponent(ModifierEtudeTerrain);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
