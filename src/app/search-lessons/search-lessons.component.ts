import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Course} from '../model/course';
import {
  debounceTime,
  distinctUntilChanged,
  startWith,
  tap,
  delay,
  map,
  concatMap,
  switchMap,
  withLatestFrom,
  concatAll, shareReplay
} from 'rxjs/operators';
import {merge, fromEvent, Observable, concat} from 'rxjs';
import {Lesson} from '../model/lesson';
import { MatFormField, MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';


@Component({
    selector: 'course',
    templateUrl: './search-lessons.component.html',
    styleUrls: ['./search-lessons.component.css'],
    imports: [MatFormField, MatInput, MatButton, MatIcon]
})
export class SearchLessonsComponent implements OnInit {

  constructor() {


  }

  ngOnInit() {


  }

}











