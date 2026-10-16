import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonOrganisation } from './mon-organisation';

describe('MonOrganisation', () => {
  let component: MonOrganisation;
  let fixture: ComponentFixture<MonOrganisation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonOrganisation],
    }).compileComponents();

    fixture = TestBed.createComponent(MonOrganisation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
