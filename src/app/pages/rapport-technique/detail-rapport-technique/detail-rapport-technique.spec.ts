import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailRapportTechnique } from './detail-rapport-technique';

describe('DetailRapportTechnique', () => {
  let component: DetailRapportTechnique;
  let fixture: ComponentFixture<DetailRapportTechnique>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailRapportTechnique],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailRapportTechnique);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
