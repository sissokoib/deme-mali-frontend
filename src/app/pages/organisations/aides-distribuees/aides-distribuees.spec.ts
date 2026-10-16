import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AidesDistribuees } from './aides-distribuees';

describe('AidesDistribuees', () => {
  let component: AidesDistribuees;
  let fixture: ComponentFixture<AidesDistribuees>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AidesDistribuees],
    }).compileComponents();

    fixture = TestBed.createComponent(AidesDistribuees);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
