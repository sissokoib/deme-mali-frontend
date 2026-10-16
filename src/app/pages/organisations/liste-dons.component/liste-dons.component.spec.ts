import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeDonsComponent } from './liste-dons.component';

describe('ListeDonsComponent', () => {
  let component: ListeDonsComponent;
  let fixture: ComponentFixture<ListeDonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeDonsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListeDonsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
