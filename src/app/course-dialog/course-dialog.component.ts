import {AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from "@angular/material/dialog";
import {Course} from "../model/course";
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from "@angular/forms";
import moment from 'moment';
import {catchError} from 'rxjs/operators';
import {throwError} from 'rxjs';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatInput, MatSuffix } from '@angular/material/input';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatDatepickerInput, MatDatepickerToggle, MatDatepicker } from '@angular/material/datepicker';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'course-dialog',
    templateUrl: './course-dialog.component.html',
    styleUrls: ['./course-dialog.component.css'],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, ReactiveFormsModule, MatFormField, MatInput, MatSelect, MatOption, MatDatepickerInput, MatDatepickerToggle, MatSuffix, MatDatepicker, MatDialogActions, MatButton]
})
export class CourseDialogComponent implements AfterViewInit {

    form: FormGroup;

    course:Course;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<CourseDialogComponent>,
        @Inject(MAT_DIALOG_DATA) course:Course) {

        this.course = course;

        this.form = fb.group({
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

    }

    close() {
        this.dialogRef.close();
    }

}
