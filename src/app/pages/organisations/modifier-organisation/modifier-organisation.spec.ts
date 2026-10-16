import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifierOrganisation } from './modifier-organisation';

describe('ModifierOrganisation', () => {
  let component: ModifierOrganisation;
  let fixture: ComponentFixture<ModifierOrganisation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifierOrganisation],
    }).compileComponents();

    fixture = TestBed.createComponent(ModifierOrganisation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
