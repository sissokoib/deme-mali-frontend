import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailBeneficiaire } from './detail-beneficiaire';

describe('DetailBeneficiaire', () => {
  let component: DetailBeneficiaire;
  let fixture: ComponentFixture<DetailBeneficiaire>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailBeneficiaire],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailBeneficiaire);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
