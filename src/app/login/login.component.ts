import {Component, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';


import {Router} from '@angular/router';
import { MatCard, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatFormField, MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    imports: [MatCard, MatCardTitle, MatCardContent, ReactiveFormsModule, MatFormField, MatInput, MatButton]
})
export class LoginComponent implements OnInit {

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router) {

    this.form = fb.group({
      email: ['test@angular-university.io', [Validators.required]],
      password: ['test', [Validators.required]]
    });

  }

  ngOnInit() {

  }

  login() {

    const val = this.form.value;



  }

}
