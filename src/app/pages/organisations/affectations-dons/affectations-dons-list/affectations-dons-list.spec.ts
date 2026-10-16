import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AffectationsDonsList } from './affectations-dons-list';

describe('AffectationsDonsList', () => {
  let component: AffectationsDonsList;
  let fixture: ComponentFixture<AffectationsDonsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AffectationsDonsList],
    }).compileComponents();

    fixture = TestBed.createComponent(AffectationsDonsList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
