import { Component, inject, OnInit } from '@angular/core';
import { Course, sortCoursesBySeqNo } from '../model/course';
import { interval, noop, Observable, of, throwError, timer } from 'rxjs';
import { catchError, delay, delayWhen, filter, finalize, map, retryWhen, shareReplay, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CourseDialogComponent } from '../course-dialog/course-dialog.component';
import { CoursesService } from '../service/courses.service';
import { CoursesCardListComponent } from '../courses-card-list/courses-card-list.component';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { AsyncPipe } from '@angular/common';
import { LoadingService } from '../loading/loading.service';


@Component({
    selector: 'home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    imports: [MatTabGroup, MatTab, AsyncPipe, CoursesCardListComponent]
})
export class HomeComponent implements OnInit {

  beginnerCourses$: Observable<Course[]>;

  advancedCourses$: Observable<Course[]>;

  private readonly courcesService = inject(CoursesService);
  private readonly loadingService = inject(LoadingService);


  ngOnInit() {
    this.changeCourse();
  }

  changeCourse() {
    
    const cources$ = this.courcesService.loadALLCourses().pipe(
      map(courses => courses.sort(sortCoursesBySeqNo))
    );

    const courseLoading$ = this.loadingService.showLoaderUntilCompleted(cources$);
    // BEGINNER COURSERS
    this.beginnerCourses$ = courseLoading$.pipe(
      map(courses =>
        courses.filter(course => course.category == "BEGINNER")
      )
    );

    // ADVANCED COURSERS
    this.advancedCourses$ = courseLoading$.pipe(
      map(courses =>
        courses.filter(course => course.category == "ADVANCED")
      )
    );
  }
}




