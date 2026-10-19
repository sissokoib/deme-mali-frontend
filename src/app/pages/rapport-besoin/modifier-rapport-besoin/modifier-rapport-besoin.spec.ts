import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifierRapportBesoin } from './modifier-rapport-besoin';

describe('ModifierRapportBesoin', () => {
  let component: ModifierRapportBesoin;
  let fixture: ComponentFixture<ModifierRapportBesoin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifierRapportBesoin],
    }).compileComponents();

    fixture = TestBed.createComponent(ModifierRapportBesoin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
