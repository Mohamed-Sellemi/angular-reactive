import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Course } from '../model/course';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CourseDialogComponent } from '../course-dialog/course-dialog.component';
import { filter, tap } from 'rxjs/operators';

@Component({
  selector: 'courses-card-list',
  imports: [],
  templateUrl: './courses-card-list.component.html',
  styleUrl: './courses-card-list.component.css',
})
export class CoursesCardListComponent {

 
  @Input() courses : Course[] = [];

  @Output() coursechanged = new EventEmitter();

  private dialog = inject(MatDialog);

   editCourse(course: Course) {

    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = "400px";

    dialogConfig.data = course;

    const dialogRef = this.dialog.open(CourseDialogComponent, dialogConfig); 
    dialogRef.afterClosed()
      .pipe(
        filter(val => !!val),
        tap(() => this.coursechanged.emit())
      )
      .subscribe()
  }
}
