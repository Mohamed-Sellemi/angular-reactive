import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable()
export class LoadingService {

    loading$: Observable<boolean>;

    loadingOn() {

    }

    loadingOff() {
        
    }
}