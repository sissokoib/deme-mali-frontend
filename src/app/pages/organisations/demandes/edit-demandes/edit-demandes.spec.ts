import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditDemandes } from './edit-demandes';

describe('EditDemandes', () => {
  let component: EditDemandes;
  let fixture: ComponentFixture<EditDemandes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDemandes],
    }).compileComponents();

    fixture = TestBed.createComponent(EditDemandes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
