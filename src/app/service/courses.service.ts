import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Course } from "../model/course";
import { map } from "rxjs/operators";


@Injectable({
    providedIn: 'root'
})
export class CoursesService {

    private http = inject(HttpClient);

    //le service doit être statless ( ne garde pas en mémoire des données de l'application)
    // les méthodes du service doivenet retourner un observable
    loadALLCourses(): Observable<Course[]> {
        return this.http.get<Course[]>("/api/courses")
            .pipe(
                map(res => res["payload"])
            );
    }

}