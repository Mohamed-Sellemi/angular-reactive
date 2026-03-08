import { Component, inject, OnInit } from '@angular/core';
import {Observable} from 'rxjs';
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { LoadingService } from './loading.service';
import { AsyncPipe } from '@angular/common';


@Component({
    selector: 'loading',
    templateUrl: './loading.component.html',
    styleUrls: ['./loading.component.css'],
    imports: [MatProgressSpinner, AsyncPipe]
})
export class LoadingComponent implements OnInit {

  readonly loadingService = inject(LoadingService);
  constructor() {

  }

  ngOnInit() {

  }


}
