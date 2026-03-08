import {Component, OnInit} from '@angular/core';
import { MatSidenavContainer, MatSidenav } from '@angular/material/sidenav';
import { MatNavList, MatListItem } from '@angular/material/list';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconButton } from '@angular/material/button';
import { LoadingComponent } from './loading/loading.component';
import { LoadingService } from './loading/loading.service';



@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    imports: [MatSidenavContainer, MatSidenav, MatNavList, MatListItem, RouterLink, MatIcon, MatToolbar, MatIconButton, RouterOutlet, LoadingComponent],
    providers: [
      LoadingService
    ]
})
export class AppComponent implements  OnInit {

    constructor() {

    }

    ngOnInit() {


    }

  logout() {

  }

}
