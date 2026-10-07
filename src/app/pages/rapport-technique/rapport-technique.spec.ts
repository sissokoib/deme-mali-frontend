import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RapportTechnique } from './rapport-technique';

describe('RapportTechnique', () => {
  let component: RapportTechnique;
  let fixture: ComponentFixture<RapportTechnique>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RapportTechnique],
    }).compileComponents();

    fixture = TestBed.createComponent(RapportTechnique);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
