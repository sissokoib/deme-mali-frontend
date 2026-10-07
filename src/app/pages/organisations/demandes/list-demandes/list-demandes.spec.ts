import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListDemandes } from './list-demandes';

describe('ListDemandes', () => {
  let component: ListDemandes;
  let fixture: ComponentFixture<ListDemandes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListDemandes],
    }).compileComponents();

    fixture = TestBed.createComponent(ListDemandes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
