import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreuvesDistribution } from './preuves-distribution';

describe('PreuvesDistribution', () => {
  let component: PreuvesDistribution;
  let fixture: ComponentFixture<PreuvesDistribution>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreuvesDistribution],
    }).compileComponents();

    fixture = TestBed.createComponent(PreuvesDistribution);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
