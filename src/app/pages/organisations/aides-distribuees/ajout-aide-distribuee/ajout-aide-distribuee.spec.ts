import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjoutAideDistribuee } from './ajout-aide-distribuee';

describe('AjoutAideDistribuee', () => {
  let component: AjoutAideDistribuee;
  let fixture: ComponentFixture<AjoutAideDistribuee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjoutAideDistribuee],
    }).compileComponents();

    fixture = TestBed.createComponent(AjoutAideDistribuee);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
