import {AfterViewInit, Component, ElementRef, EventEmitter, inject, Inject, OnInit, Output, output, ViewChild, ViewEncapsulation} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from "@angular/material/dialog";
import {Course} from "../model/course";
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from "@angular/forms";
import moment from 'moment';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatInput, MatSuffix } from '@angular/material/input';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatDatepickerInput, MatDatepickerToggle, MatDatepicker } from '@angular/material/datepicker';
import { MatButton } from '@angular/material/button';
import { CoursesService } from '../service/courses.service';
import { LoadingService } from '../loading/loading.service';
import { LoadingComponent } from "../loading/loading.component";

@Component({
    selector: 'course-dialog',
    templateUrl: './course-dialog.component.html',
    styleUrls: ['./course-dialog.component.css'],
    providers:[
        LoadingService
    ],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, ReactiveFormsModule, MatFormField, MatInput, MatSelect, MatOption, MatDatepickerInput, MatDatepickerToggle, MatSuffix, MatDatepicker, MatDialogActions, MatButton, LoadingComponent]
})
export class CourseDialogComponent implements AfterViewInit {

    form: FormGroup;

    course:Course;
    private readonly coursesService = inject(CoursesService);
    private readonly loadingService = inject(LoadingService);
    private fb = inject(FormBuilder);
    constructor(
        
        private dialogRef: MatDialogRef<CourseDialogComponent>,       

        @Inject(MAT_DIALOG_DATA) course:Course) {

        this.course = course;

        this.form = this.fb.group({
            description: [course.description, Validators.required],
            category: [course.category, Validators.required],
            releasedAt: [moment(), Validators.required],
            longDescription: [course.longDescription,Validators.required]
        });

    }

    ngAfterViewInit() {

    }

    save() {

      const changes = this.form.value;
      const saveCourse$ =this.coursesService.saveCourse(this.course.id, changes);
      this.loadingService.showLoaderUntilCompleted(saveCourse$)
        .subscribe(
            val => {
                this.dialogRef.close(val);                
            }
        );


    }

    close() {
        this.dialogRef.close();
    }

}
