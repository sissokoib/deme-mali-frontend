import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonsAttribues } from './dons-attribues';

describe('DonsAttribues', () => {
  let component: DonsAttribues;
  let fixture: ComponentFixture<DonsAttribues>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonsAttribues],
    }).compileComponents();

    fixture = TestBed.createComponent(DonsAttribues);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
