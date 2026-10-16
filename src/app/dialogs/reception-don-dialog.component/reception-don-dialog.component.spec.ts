import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceptionDonDialogComponent } from './reception-don-dialog.component';

describe('ReceptionDonDialogComponent', () => {
  let component: ReceptionDonDialogComponent;
  let fixture: ComponentFixture<ReceptionDonDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceptionDonDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceptionDonDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
