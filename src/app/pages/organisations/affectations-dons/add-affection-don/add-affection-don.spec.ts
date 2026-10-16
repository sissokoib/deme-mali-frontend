import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAffectionDon } from './add-affection-don';

describe('AddAffectionDon', () => {
  let component: AddAffectionDon;
  let fixture: ComponentFixture<AddAffectionDon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAffectionDon],
    }).compileComponents();

    fixture = TestBed.createComponent(AddAffectionDon);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
