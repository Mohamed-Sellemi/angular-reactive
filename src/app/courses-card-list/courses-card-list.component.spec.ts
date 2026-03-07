import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoursesCardListComponent } from './courses-card-list.component';

describe('CoursesCardListComponent', () => {
  let component: CoursesCardListComponent;
  let fixture: ComponentFixture<CoursesCardListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoursesCardListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoursesCardListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
