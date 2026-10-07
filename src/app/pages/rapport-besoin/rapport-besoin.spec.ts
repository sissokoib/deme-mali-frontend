import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RapportBesoin } from './rapport-besoin';

describe('RapportBesoin', () => {
  let component: RapportBesoin;
  let fixture: ComponentFixture<RapportBesoin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RapportBesoin],
    }).compileComponents();

    fixture = TestBed.createComponent(RapportBesoin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
