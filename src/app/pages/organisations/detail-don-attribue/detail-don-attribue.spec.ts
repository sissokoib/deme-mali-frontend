import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailDonAttribue } from './detail-don-attribue';

describe('DetailDonAttribue', () => {
  let component: DetailDonAttribue;
  let fixture: ComponentFixture<DetailDonAttribue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailDonAttribue],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailDonAttribue);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
