import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {
  concat,
  fromEvent,
  interval,
  noop,
  observable,
  Observable,
  of,
  timer,
  merge,
  Subject,
  BehaviorSubject,
  AsyncSubject,
  ReplaySubject, from
} from 'rxjs';
import {delayWhen, filter, map, take, timeout} from 'rxjs/operators';
import { MatButton } from '@angular/material/button';



@Component({
    selector: 'about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.css'],
    imports: [MatButton]
})
export class AboutComponent implements OnInit {

    ngOnInit() {


    }


  run() {



  }


}






