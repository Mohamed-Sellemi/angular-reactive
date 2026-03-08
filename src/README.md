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
1- `Convert all components, directives and pipes to standalone`.
2- `Remove unnecessary NgModule classes`.
3- `Switch to standalone bootstrapping API`.

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
```
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
                                  boolean normal |       Observable<boolean>
Mise à jour UI                    Manuelle / polling     Automatique ✅
Notification des abonnés          ❌ aucune             ✅ automatique
Utilisable avec async pipe        ❌                    ✅
Adapté à Angular réactif          ❌                    ✅
