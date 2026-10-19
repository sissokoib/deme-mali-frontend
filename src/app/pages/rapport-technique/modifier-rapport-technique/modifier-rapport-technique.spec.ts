import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifierRapportTechnique } from './modifier-rapport-technique';

describe('ModifierRapportTechnique', () => {
  let component: ModifierRapportTechnique;
  let fixture: ComponentFixture<ModifierRapportTechnique>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifierRapportTechnique],
    }).compileComponents();

    fixture = TestBed.createComponent(ModifierRapportTechnique);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
