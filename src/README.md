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

## Convertir vers un projet Angular standalone
la commande ci-dessous permet de convertir un projet Angular avec les modules vers un projet `standalone`
- Il faut exécuté cette commande 3 fois, sur 3 étapes et à chaque fois il faut choisir dans le menu interactif.

```bash
ng generate @angular/core:standalone
```
1- `Convert all components, directives and pipes to standalone`.
2- `Remove unnecessary NgModule classes`.
3- `Switch to standalone bootstrapping API`.
