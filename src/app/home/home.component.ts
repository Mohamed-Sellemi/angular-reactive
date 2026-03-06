import { Component, inject, OnInit } from '@angular/core';
import { Course, sortCoursesBySeqNo } from '../model/course';
import { interval, noop, Observable, of, throwError, timer } from 'rxjs';
import { catchError, delay, delayWhen, filter, finalize, map, retryWhen, shareReplay, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CourseDialogComponent } from '../course-dialog/course-dialog.component';
import { CoursesService } from '../service/courses.service';


@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false
})
export class HomeComponent implements OnInit {

  beginnerCourses$: Observable<Course[]>;

  advancedCourses$: Observable<Course[]>;

  private readonly courcesService = inject(CoursesService);
  private dialog = inject(MatDialog);

  // la vue ne connait pas comment les données sont récupérées, elle les prend qu' a travers les observables.  

  // async du html: permet de s'abonner à l'observable et met en disposition les données au UI
  // en plus au moment ou on a plus besoin de l'observable se désabonner de ce dernier et comme ça 
  // on aura pas la fuite de mémoire
  ngOnInit() {

    const cources$ = this.courcesService.loadALLCourses().pipe(
      map(courses => courses.sort(sortCoursesBySeqNo))
    );
    // BEGINNER COURSERS
    this.beginnerCourses$ = cources$.pipe(
      map(courses =>
        courses.filter(course => course.category == "BEGINNER")
      )
    );

    // ADVANCED COURSERS
    this.advancedCourses$ = cources$.pipe(
      map(courses =>
        courses.filter(course => course.category == "ADVANCED")
      )
    );

  }

  editCourse(course: Course) {

    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = "400px";

    dialogConfig.data = course;

    const dialogRef = this.dialog.open(CourseDialogComponent, dialogConfig);

  }

}




