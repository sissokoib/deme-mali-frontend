import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailDon } from './detail-don';

describe('DetailDon', () => {
  let component: DetailDon;
  let fixture: ComponentFixture<DetailDon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailDon],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailDon);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
