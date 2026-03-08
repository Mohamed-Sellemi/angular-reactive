# Principes Réactifs en Angular

---

## Vue en Angular

> La vue ne connaît pas comment les données sont récupérées — elle les consomme uniquement à travers des **observables**.

---

## Composant Smart vs Composant de Présentation

### Composants Smart (Container)

*Comment ça marche*

- Contiennent la logique métier
- Injectent des services
- Gèrent l'état et les effets de bord
- Implémentent des règles métier

### Composants de Présentation (Dumb)

*À quoi ça ressemble*

- Affichent les données via `@Input()`
- Émettent des événements via `@Output()`
- Sans dépendances externes
- Purement « dumb » (stupides / sans logique)

### Exemple

`CoursesCardListComponent` est un composant de présentation : il ne sait rien sur les données, ni comment elles sont récupérées, ni d'où elles viennent. Il les reçoit uniquement via :

```ts
@Input() courses: Course[] = [];
```

---

## Passage de l'Impératif au Réactif

- Le composant **ne doit pas manipuler des données mutables** — il doit gérer des **observables** (flux de données).
- Il peut également gérer des **observables dérivés**, comme dans `HomeComponent` qui expose `courses$` et en dérive `coursesDebutant$` et `coursesAdvanced$`.
- Si ces observables sont consommés par l'UI, il est préférable d'utiliser le pipe **`async`** d'Angular.

---

## Le Pipe `async`

Le pipe `async` dans le template HTML permet de :

1. **S'abonner** automatiquement à l'observable
2. **Mettre les données à disposition** de l'UI
3. **Se désabonner** automatiquement lorsque le composant est détruit → **pas de fuite mémoire**

```html
<div *ngIf="courses$ | async as courses">
  ...
</div>
```

---

## Service Stateless

- Le service doit être **stateless** (il ne garde pas en mémoire les données de l'application).
- Les méthodes du service doivent **retourner un observable**.

---

## Pattern et Anti-Pattern

> **Rappel :** Dès qu'on souscrit à un observable de type HTTP, celui-ci s'exécute, c'est-à-dire qu'il effectue un appel à l'API.

### ❌ Anti-Pattern

`beginnerCourses$` et `advancedCourses$` souscrivent tous les deux à l'observable `courses$` via le pipe `async`. À chaque souscription, le `subscribe` défini dans `CoursesService` est déclenché — ce qui provoque **2 appels à l'API** pour un seul chargement de page.

### ✅ Solution — `shareReplay`

> Cette solution s'applique **uniquement** aux observables de type HTTP.

Pour n'effectuer la requête vers l'API **qu'une seule fois**, on utilise l'opérateur **`shareReplay`** de RxJS :

```ts
courses$ = this.coursesService.loadCourses().pipe(
  shareReplay()
);
```

`shareReplay` met le résultat en cache et le **partage** entre tous les souscripteurs — évitant ainsi les appels HTTP redondants.


## Modifier un cours avec un service stateless

### Schéma du flux

```
┌─────────────────────────────────────────────────────────────────┐
│                        HomeComponent                            │
│                     (Container / Smart)                         │
│                                                                 │
│  Écoute @Output()  ◄──────────────────────────────────────┐    │
│  (courseChanged)                                           │    │
└─────────────────────────────────────────────────────────────┘   │
          │                                                  │    │
          ▼                                                  │    │
┌─────────────────────────┐                                  │    │
│   CoursesCardList       │                                  │    │
│  (Présentation / Dumb)  │                                  │    │
│                         │   ④ EventEmitter                 │    │
│  dialogRef.afterClosed()│──── courseChanged ───────────────┘    │
│  ③ subscribe            │                                       │
└─────────────────────────┘                                       │
          │                                                        │
          │ ouvre le dialog                                        │
          ▼                                                        │
┌─────────────────────────┐       ┌──────────────────────────┐    │
│    CourseDialogComponent│       │      CoursesService       │    │
│       (Popup)           │──────►│     (Stateless)           │    │
│                         │  ①   │                           │    │
│  save()                 │  call │  saveCourse(id, changes)  │    │
│                         │◄──────│  → http.put(...)          │    │
│  dialogRef.close(val) ──┘  ②   │  → retourne Observable    │    │
│                         │  val  └──────────────────────────┘    │
└─────────────────────────┘                                        │
```

---

### Les étapes détaillées

#### ① Service — ajout de `saveCourse()`

Dans `CoursesService`, on ajoute une méthode `saveCourse()` qui utilise `http.put` pour modifier un cours côté API. Le service reste **stateless** : il ne stocke rien, il retourne simplement un observable.

```ts
saveCourse(courseId: string, changes: Partial<Course>): Observable<any> {
  return this.http.put(`/api/courses/${courseId}`, changes);
}
```
**NB: dans saveCourse on utilise aussi shareReply pour garder en mémoire la valeur retourner de l'API et exécuter une seule fois.**
---

#### ② Popup — `CourseDialogComponent`

Dans le composant dialog, on crée une méthode `save()` qui :
1. Souscrit à `saveCourse()` du service
2. Ferme le popup en passant la valeur récupérée depuis l'observable via `dialogRef.close(val)`

```ts
save() {
  const changes = this.form.value;

  this.coursesService.saveCourse(this.course.id, changes)
    .subscribe(
      val => {
        this.dialogRef.close(val); // ② on ferme en passant la valeur
      }
    );
}
```

> `dialogRef.close(val)` est clé : si `val` est défini, cela signifie que le popup s'est fermé suite à une **sauvegarde**, pas suite au bouton "Fermer".

---

#### ③ `CoursesCardListComponent` — écoute de la fermeture du dialog

Après ouverture du dialog, on souscrit à `afterClosed()` pour savoir **pourquoi** le popup s'est fermé :

- `val` est défini → fermeture suite à une **sauvegarde** → on informe le parent
- `val` est `undefined` → fermeture via le bouton **"Fermer"** → on ne fait rien

```ts
const dialogRef = this.dialog.open(CourseDialogComponent, { data: course });

dialogRef.afterClosed().subscribe(val => {
  if (val) {
    this.courseChanged.emit(val); // ④ on informe le parent uniquement si sauvegarde, sachant que courseChanged est eventEmitter()
  }
});
```

---

#### ④ `CoursesCardListComponent` → `HomeComponent` via `@Output()`

`CoursesCardListComponent` remonte l'événement au container parent `HomeComponent` via un `EventEmitter` :

```ts
@Output() courseChanged = new EventEmitter<Course>();
```

`HomeComponent` écoute cet événement pour déclencher un rechargement des données si nécessaire. parceque on'est aujourd'hui dans une application stateless, donc obligé de recharger les données (`coursesAdvanced$`, `coursesBeginner$`).

---

### Résumé du flux

| Étape | Qui | Quoi |
|---|---|---|
| ① | `CoursesService` | `http.put` → retourne un Observable |
| ② | `CourseDialogComponent` | Subscribe → `dialogRef.close(val)` |
| ③ | `CoursesCardListComponent` | Subscribe à `afterClosed()` → vérifie `val` |
| ④ | `CoursesCardListComponent` | Émet `courseChanged` vers `HomeComponent` |

## Convertir vers un projet Angular standalone
la commande ci-dessous permet de convertir un projet Angular avec les modules vers un projet `standalone`
- Il faut exécuté cette commande 3 fois, sur 3 étapes et à chaque fois il faut choisir dans le menu interactif.

```bash
ng generate @angular/core:standalone
```
- 1 `Convert all components, directives and pipes to standalone`.
- 2 `Remove unnecessary NgModule classes`.
- 3 `Switch to standalone bootstrapping API`.

## Passage de données à un composant fils 

### @Input() via template HTML
```html
<!-- Parent -->
<course-card-list [courses]="courses$"></course-card-list>
```
```ts
// Enfant
@Input() courses: Course[] = [];
```
### Cas Dialog : popup
Le popup est crée de façon dynamique, n'est pas déclaré dans un template HTML. Angular matérialise lui-même le composant en mémoire.

Le passage se fait en 2 temps:
① On met le course dans la config avant d'ouvrir
```ts
// CoursesCardListComponent
dialogConfig.data = course;  // 👈 on emballe le course ici

this.dialog.open(CourseDialogComponent, dialogConfig);
```
② Le dialog le récupère via @Inject(MAT_DIALOG_DATA)
```ts
// CourseDialogComponent
constructor(
  private dialogRef: MatDialogRef<CourseDialogComponent>,
  @Inject(MAT_DIALOG_DATA) course: Course  // 👈 Angular injecte ce qui était dans dialogConfig.data
) {
  this.course = course;
}
```
`MAT_DIALOG_DATA` est un **token d'injection** — c'est une clé que Angular Material utilise pour transporter `dialogConfig.data` jusqu'au constructeur du dialog. C'est du système d'**injection de dépendances** d'Angular, pas du binding de template.

## Schéma comparatif
```
── Via @Input() ──────────────────────────────────────────
  Template HTML          Composant enfant
  ┌─────────────┐        ┌──────────────────┐
  │ [course]=   │──────► │ @Input() course   │
  │ "myCourse"  │        │                  │
  └─────────────┘        └──────────────────┘
  Lien déclaratif dans le HTML


── Via MAT_DIALOG_DATA ───────────────────────────────────
  Code TypeScript        Dialog (créé dynamiquement)
  ┌─────────────────┐    ┌──────────────────────────────┐
  │ dialogConfig    │    │ constructor(                  │
  │  .data = course │──► │  @Inject(MAT_DIALOG_DATA)    │
  │                 │    │  course: Course               │
  │ dialog.open()   │    │ )                             │
  └─────────────────┘    └──────────────────────────────┘
  Lien via l'injection de dépendances (DI)
  ```

## Communication entre plusieurs composants à des niveaux différents

Supposons qu'on a plusieurs composants qui se trouvent dans différents niveaux de l'application et qui veulent interaginr (communiquer) entre eux.

✅ La solution la plus simple est d'utiliser un service partageable (Shared service)

### Exemple:
On veut rajouter un spinner, utilisé au moment d'interaction avec l'api, il existe différents emplacements de communication avec l'API, 
Par exemple `HomeComponent` on charge les courses, `CourseDialogComponent` modifier un course. 
- Le principe de mettre le spinner dans `AppComponent` en tant que composant global à l'application, ensuite quel composant à besoin de spinner peut l'utiliser.
- Le spinner va être cacher par défaut, au moment ou un composant veut afficher le spinner, il doit informer `AppComponent` quand il affiche le spinner et quand il doit le cacher.
- pour faciliter l'interaction entre différent composants qui peuvent se trouver dans différents niveau de l'application tel le cas de `HomeComponent` et `CourseDialogComponent` avec `AppComponent` on doit créer un **service partageable** c'est `LoadingService`.
- Le service `LoadingService` doit être injecter au différent emplacement ou il sera utilisé, dans notre cas `HomeComponent` et `CourseDialogComponent` et bien sûr dans `LoadingComponent`.
- Le composant `LoadingComponent` va interagir avec le reste de l'application à travers le service `LoadingService`.
- Le service `LoadingService` ne doit pas être un singleton, si non il bloquera l'exécution des autres composant au moment qu'il s'exécute sur un composant.
- Puisque le service `LoadingService` n'est pas un singleton, donc il n'a pas de `providedIn: 'root'` on doit mentionner ou se service sera utilisé, dans notre cas c'est dans `AppComponent` donc il faut rajouter ceci
```ts
@Component({
    //....
 providers: [
      LoadingService
    ]
})
```
```
AppComponent  (instance LoadingService créée ici)
    │
    ├── LoadingComponent       ◄── même instance
    ├── HomeComponent          ◄── même instance
    └── CourseDialogComponent  ◄── même instance
```
### Expliquer pour le service ne doit pas être singleton au niveau root:
```
Avec root — si tu as PLUSIEURS AppComponent (ex: micro-frontends,
tests unitaires, ou plusieurs instances de l'app) :

AppComponent_1                    AppComponent_2
  HomeComponent                     HomeComponent
        │                                 │
        └──────────► Instance UNIQUE ◄────┘
                     LoadingService
                     
  Le show() de App1 affiche le spinner de App2 !

```

### Expliquer pourquoi utilisons un observable pour afficher ou cacher le spinner
```ts
isLoading: boolean = false;
```

`LoadingComponent` devrait **interroger** la valeur en permanence pour savoir si elle a changé. Il n'y a aucun mécanisme automatique pour dire "hé, la valeur a changé, mets à jour l'UI".
```
LoadingService          LoadingComponent
┌──────────────┐        ┌──────────────────────┐
│ isLoading    │        │ comment je sais que  │
│ = false      │   ??   │ isLoading a changé ? │
│              │        │ je poll toutes les   │
│              │        │ X ms ? 😬            │
└──────────────┘        └──────────────────────┘
```

---

## Avec un `Observable<boolean>`

L'observable est un **flux** — dès que la valeur change, **tous les abonnés sont notifiés automatiquement**. C'est le principe du pattern **Observer**.
```
LoadingService                    LoadingComponent
┌─────────────────────┐           ┌──────────────────────┐
│ loading$            │  push !   │ | async              │
│ Observable<boolean> │ ────────► │ reçoit true/false    │
│                     │           │ met à jour l'UI ✅   │
└─────────────────────┘           └──────────────────────┘
 ```

 Résumé
 | | `boolean` normal | `Observable<boolean>` |
|---|---|---|
| Mise à jour UI | Manuelle / polling | Automatique ✅ |
| Notification des abonnés | ❌ aucune | ✅ automatique |
| Utilisable avec `async` pipe | ❌ | ✅ |
| Adapté à Angular réactif | ❌ | ✅ |


## Pourquoi rajouter un observable de type subject dans LoadingService

### Le problème — un Observable normal est en lecture seule
Un Observable de base, tu peux seulement t'abonner pour écouter des valeurs. Tu ne peux pas pousser une nouvelle valeur dedans de l'extérieur.

```ts
loading$ = new Observable<boolean>(); 

loading$.next(true); // ❌ IMPOSSIBLE — .next() n'existe pas sur Observable

`Observable` n'a pas de méthode `.next()`. C'est un **récepteur**, pas un émetteur.

```
### Différence entre un observable HTTP et un observable perso
```ts
// Cas 1 — HTTP
loadAllCourses(): Observable<Course[]> {
  return this.http.get<Course[]>("/api/courses"); 
}

// Cas 2 — BehaviorSubject
private loadingSubject = new BehaviorSubject<boolean>(false);
loading$ = this.loadingSubject.asObservable();
```

---

## Cas 1 — `http.get` : qui contrôle les émissions ?

C'est **Angular/RxJS en interne** qui gère tout. Quand tu fais `http.get(...)`, Angular crée un observable ET gère lui-même le `.next()` et le `.complete()` en coulisses.
```
Tu ne vois pas ce code, mais il existe quelque part dans Angular :

observableInterne.next(response)   // ← Angular appelle ça quand l'API répond
observableInterne.complete()       // ← Angular appelle ça après
observableInterne.error(err)       // ← Angular appelle ça si erreur
```

Toi tu reçois juste **l'observable résultant** — tu ne gères pas les émissions, Angular le fait pour toi. C'est pour ça qu'on dit qu'il "émet des valeurs" même si techniquement tu ne vois que le `return`.
```
Angular HTTP internals          Toi
┌─────────────────────┐        ┌──────────────────────┐
│ appel API           │        │ loadAllCourses()      │
│ réponse reçue       │        │   .subscribe(        │
│ .next(response) ───►│───────►│     courses => ...   │
│ .complete()         │        │   )                  │
└─────────────────────┘        └──────────────────────┘
  Angular gère les émissions     Tu consommes seulement
```

---

## Cas 2 — `BehaviorSubject` : qui contrôle les émissions ?

Ici il n'y a pas d'Angular ou de RxJS "en coulisses" qui gère les émissions. **C'est TOI qui décides** quand émettre `true` ou `false` via `.next()`. Donc tu as besoin d'accès direct au `BehaviorSubject`.

### `BehaviorSubject` — le double rôle

`BehaviorSubject` est à la fois :
- un **Observable** → on peut s'y abonner pour écouter
- un **émetteur** → on peut lui pousser des valeurs avec `.next()`
```
BehaviorSubject<boolean>
┌─────────────────────────────────┐
│                                 │
│  .next(true)  ◄── on écrit      │  ← rôle émetteur
│                                 │
│  .asObservable() ──► abonnés    │  ← rôle observable
│                                 │
└─────────────────────────────────┘
```
```
Toi (LoadingService)            Abonnés
┌─────────────────────┐        ┌──────────────────────┐
│ loadingOn()         │        │ loading$ | async     │
│ .next(true)  ──────►│───────►│ affiche spinner ✅   │
│                     │        │                      │
│ loadingOff()        │        │                      │
│ .next(false) ──────►│───────►│ cache spinner ✅     │
└─────────────────────┘        └──────────────────────┘
  Tu gères les émissions         Les composants consomment
```
### Pourquoi ne pas exposer directement le BehaviorSubject ?
```ts
loading$ = new BehaviorSubject<boolean>(false);

// Dans LoadingComponent
loadingService.loading$.next(false); // 😱 n'importe qui peut écrire !
```
N'importe quel composant pourrait appeler `.next()` directement et modifier l'état — c'est dangereux. On perd le contrôle sur qui peut modifier la valeur.

✅ La solution est de spéarer lecture et écriture
```ts
@Injectable()
export class LoadingService {

  // ① privé — seul le service peut écrire dedans
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // ② public — les composants peuvent seulement écouter
  loading$ = this.loadingSubject.asObservable();

  loadingOn() {
    this.loadingSubject.next(true);  // ✅ seul le service écrit
  }

  loadingOff() {
    this.loadingSubject.next(false); // ✅ seul le service écrit
  }
}
```
```
LoadingService
┌──────────────────────────────────────────────┐
│                                              │
│  private loadingSubject ──► .next(true/false)│ ← seul le service écrit
│          │                                   │
│          │ .asObservable()                   │
│          ▼                                   │
│  public loading$ ───────────────────────────►│ ← composants écoutent
│                                              │
└──────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
   HomeComponent          LoadingComponent
   loadingOn()            loading$ | async
   loadingOff()           affiche/cache spinner
   ```

## Lier le spinner avec HomeComponent

Le spinner est liée au cycle de vie de l'observable qui permet de charger les courses
il doit être affiché au début de téléchargement des cours, ensuite il doit être caché lorsque l'observable termine de charger tous les courses ou une génération d'erreur.

### principe:
- activer l'affichage de spinner 
```ts
changeCourse() {
    this.loadingService.loadingOn();
    const cources$ = this.courcesService.loadALLCourses().pipe(
        //...
```

- cacher le spinner dès l'observable termine
```ts
const cources$ = this.courcesService.loadALLCourses().pipe(
      map(courses => courses.sort(sortCoursesBySeqNo)),
      finalize(() => this.loadingService.loadingOff())
    );
```
📢 le `finalize()`: est exécuté dès que l'observable complète d'envoyer les éléments, ou bien dès qu'il y a une erreur qui se produit.

## Optimisation de on/off du spinner
### méthode: 1
```ts
this.loadingService.loadingOn(); // ← appelé manuellement
const courses$ = this.coursesService.loadAllCourses().pipe(
  map(courses => courses.sort(sortCoursesBySeqNo)),
  finalize(() => this.loadingService.loadingOff()) // ← appelé manuellement
);
```

### Problèmes

**① Logique technique dans le composant** — le composant ne devrait pas savoir comment gérer le spinner. C'est une responsabilité du `LoadingService`.

**② Risque d'oubli** — si un autre développeur utilise `loadAllCourses()` ailleurs, il doit penser à appeler `loadingOn()` et `loadingOff()` manuellement à chaque fois.

**③ Risque de fuite** — si une erreur survient avant `finalize()`, ou si on oublie `finalize()`, le spinner reste bloqué à `true` pour toujours.
```
HomeComponent        LoadingService
┌─────────────────┐  ┌──────────────┐
│ loadingOn() ───►│─►│ next(true)   │
│ loadAllCourses()│  │              │
│ finalize()  ───►│─►│ next(false)  │
│                 │  │              │
│ 😬 logique      │  │              │
│ du spinner ici  │  │              │
└─────────────────┘  └──────────────┘
  composant sait trop de choses
  ```

### méthode: 2
```ts
showLoaderUntilCompleted<T>(obs$: Observable<T>): Observable<T> {
  return of(null).pipe(
    tap(() => this.loadingOn()),      // ① active le spinner
    concatMap(() => obs$),            // ② exécute l'observable passé en paramètre
    finalize(() => this.loadingOff()) // ③ désactive quoi qu'il arrive
  );
}
```

### Décryptage du pipe interne
```
of(null)  →  émet une valeur nulle juste pour démarrer la chaîne
    │
    ▼
tap()     →  effet de bord : loadingOn() sans modifier la valeur
    │
    ▼
concatMap()  →  remplace la valeur nulle par l'observable réel (courses$)
    │            et attend qu'il se termine avant de continuer
    ▼
finalize()   →  appelé quand l'observable se termine OU en cas d'erreur
```
```
HomeComponent          LoadingService
┌──────────────────┐   ┌─────────────────────────────────┐
│ courses$ ───────►│──►│ showLoaderUntilCompleted(obs$)   │
│                  │   │                                  │
│ 😊 ne sait rien  │   │  of(null)                        │
│ sur le spinner   │   │    tap → loadingOn() ✅           │
│                  │   │    concatMap → exécute courses$  │
│                  │   │    finalize → loadingOff() ✅     │
│                  │◄──│                                  │
└──────────────────┘   └─────────────────────────────────┘
```

### Avantage: 🚀

① Responsabilité unique — toute la logique du spinner est encapsulée dans LoadingService. Le composant ne sait rien.

② Réutilisable — n'importe quel composant peut l'utiliser en une ligne, sans se soucier du loadingOn/Off.

③ Sûr — finalize() est toujours appelé, même en cas d'erreur. Impossible d'oublier d'éteindre le spinner.