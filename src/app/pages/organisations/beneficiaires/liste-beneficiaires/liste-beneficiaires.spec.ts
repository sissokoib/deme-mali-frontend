import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeBeneficiaires } from './liste-beneficiaires';

describe('ListeBeneficiaires', () => {
  let component: ListeBeneficiaires;
  let fixture: ComponentFixture<ListeBeneficiaires>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeBeneficiaires],
    }).compileComponents();

    fixture = TestBed.createComponent(ListeBeneficiaires);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
