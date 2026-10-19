import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailAideDistribuee } from './detail-aide-distribuee';

describe('DetailAideDistribuee', () => {
  let component: DetailAideDistribuee;
  let fixture: ComponentFixture<DetailAideDistribuee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailAideDistribuee],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailAideDistribuee);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
