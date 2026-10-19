import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EtudesTerminer } from './etudes-terminer';

describe('EtudesTerminer', () => {
  let component: EtudesTerminer;
  let fixture: ComponentFixture<EtudesTerminer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EtudesTerminer],
    }).compileComponents();

    fixture = TestBed.createComponent(EtudesTerminer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
