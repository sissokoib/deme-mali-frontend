import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjouterRapportTechnique } from './ajouter-rapport-technique';

describe('AjouterRapportTechnique', () => {
  let component: AjouterRapportTechnique;
  let fixture: ComponentFixture<AjouterRapportTechnique>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjouterRapportTechnique],
    }).compileComponents();

    fixture = TestBed.createComponent(AjouterRapportTechnique);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
