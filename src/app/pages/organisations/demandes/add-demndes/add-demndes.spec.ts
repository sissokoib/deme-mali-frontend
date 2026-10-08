import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDemndes } from './add-demndes';

describe('AddDemndes', () => {
  let component: AddDemndes;
  let fixture: ComponentFixture<AddDemndes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDemndes],
    }).compileComponents();

    fixture = TestBed.createComponent(AddDemndes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
