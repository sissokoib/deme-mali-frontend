import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RapportBesoinDetail } from './rapport-besoin-detail';

describe('RapportBesoinDetail', () => {
  let component: RapportBesoinDetail;
  let fixture: ComponentFixture<RapportBesoinDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RapportBesoinDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(RapportBesoinDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
