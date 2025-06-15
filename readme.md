# Hash Router - Documentation

Un routeur côté client simple et puissant utilisant les hash (#) pour la navigation SPA (Single Page Application).

## 🚀 Installation

Ajoutez simplement le fichier `router.js` à votre projet :

```html
<script src="hashrouter.js"></script>
```

## 📋 Configuration de base

### Structure HTML minimale

```html
<!DOCTYPE html>
<html>
<head>
    <title>Mon App</title>
</head>
<body>
    <!-- Navigation -->
    <nav>
        <a href="#/home">Accueil</a>
        <a href="#/about">À propos</a>
        <a href="#/contact">Contact</a>
    </nav>

    <!-- Conteneur où les pages seront chargées -->
    <div id="app"></div>

    <script src="js/router.js"></script>
    <script>
        // Configuration du routeur
        router.init({
            routes: [
                { name: "home", path: "pages/home.html" },
                { name: "about", path: "pages/about.html" },
                { name: "contact", path: "pages/contact.html" }
            ],
            routerViewId: "#app",
            defaultRoute: "home"
        });
    </script>
</body>
</html>
```

## ⚙️ Configuration avancée

### Options complètes

```javascript
router.init({
    // Routes à enregistrer
    routes: [
        { 
            name: "home", 
            path: "pages/home.html",
            meta: { title: "Accueil", requiresAuth: false }
        },
        { 
            name: "dashboard", 
            path: "pages/dashboard.html",
            beforeEnter: (to) => {
                // Guard de route - vérifier l'authentification
                if (!user.isLoggedIn()) {
                    router.push('login');
                    return false;
                }
                return true;
            },
            meta: { title: "Tableau de bord", requiresAuth: true }
        }
    ],
    
    // Sélecteur de l'élément où charger les pages
    routerViewId: "#app",
    
    // Route par défaut
    defaultRoute: "home",
    
    // Page 404 personnalisée
    notFoundPage: "pages/404.html",
    
    // URL de base pour les fichiers
    baseUrl: "./",
    
    // Options de chargement
    loadingOptions: {
        showLoading: true,      // Afficher le loader
        loadingDelay: 300       // Délai en millisecondes
    }
});
```

## 🎯 Utilisation des routes

### Navigation programmatique

```javascript
// Naviguer vers une route
router.push('about');

// Naviguer avec des paramètres de requête
router.push('products', { category: 'electronics', page: 2 });
// Résultat: #/products?category=electronics&page=2

// Remplacer la route actuelle (pas d'historique)
router.replace('login');

// Retour en arrière
router.back();
```

### Récupération des informations de route

```javascript
// Obtenir la route actuelle
const currentRoute = router.getCurrentRoute();
console.log(currentRoute.name);    // nom de la route
console.log(currentRoute.path);    // chemin
console.log(currentRoute.query);   // paramètres de requête
console.log(currentRoute.meta);    // métadonnées
```

## 🛡️ Guards et Middlewares

### Guards de route (beforeEnter)

```javascript
const authGuard = (to) => {
    if (to.meta.requiresAuth && !isAuthenticated()) {
        router.push('login');
        return false; // Bloque la navigation
    }
    return true; // Autorise la navigation
};

router.addRoute('admin', 'pages/admin.html', {
    beforeEnter: authGuard,
    meta: { requiresAuth: true }
});
```

### Middlewares globaux

```javascript
// Logger toutes les navigations
router.use((context) => {
    console.log(`Navigation vers: ${context.name}`);
    document.title = context.meta.title || 'Mon App';
});

// Middleware d'authentification
router.use((context) => {
    if (context.meta.requiresAuth && !user.isLoggedIn()) {
        router.push('login');
        return false;
    }
});
```

## 📄 Exemples pratiques

### Exemple 1: Application de gestion universitaire

```javascript
document.addEventListener('DOMContentLoaded', () => {
    router.init({
        routes: [
            { name: "home", path: "pages/dashboard.html" },
            { name: "teachers", path: "pages/teachers.html" },
            { name: "students", path: "pages/students.html" },
            { name: "courses", path: "pages/courses.html" },
            { 
                name: "schedule/new", 
                path: "pages/schedule/new.html",
                meta: { title: "Nouveau planning" }
            }
        ],
        routerViewId: "#contentView",
        defaultRoute: "home",
        notFoundPage: "pages/404.html"
    });
});
```

### Exemple 2: E-commerce avec authentification

```javascript
// Configuration des routes avec protection
const routes = [
    { name: "home", path: "pages/home.html" },
    { name: "products", path: "pages/products.html" },
    { name: "login", path: "pages/login.html" },
    { 
        name: "account", 
        path: "pages/account.html",
        beforeEnter: requireAuth,
        meta: { requiresAuth: true }
    },
    { 
        name: "admin", 
        path: "pages/admin.html",
        beforeEnter: requireAdmin,
        meta: { requiresAuth: true, requiresAdmin: true }
    }
];

function requireAuth(to) {
    if (!localStorage.getItem('token')) {
        router.push('login');
        return false;
    }
    return true;
}

function requireAdmin(to) {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
        router.push('home');
        return false;
    }
    return true;
}

router.init({
    routes: routes,
    routerViewId: "#app",
    defaultRoute: "home"
});
```

### Exemple 3: Application avec composants

```javascript
// Définir des composants comme fonctions
const HomeComponent = (context) => `
    <div class="home">
        <h1>Bienvenue</h1>
        <p>Paramètres: ${JSON.stringify(context.query)}</p>
    </div>
`;

const ProductComponent = (context) => {
    const productId = context.query.id || 'inconnu';
    return `
        <div class="product">
            <h1>Produit ${productId}</h1>
            <button onclick="router.back()">Retour</button>
        </div>
    `;
};

router.init({
    routes: [
        { name: "home", component: HomeComponent },
        { name: "product", component: ProductComponent }
    ],
    routerViewId: "#app",
    defaultRoute: "home"
});
```

## 🔧 API Complète

### Méthodes principales

| Méthode | Description | Exemple |
|---------|-------------|---------|
| `init(options)` | Initialise le routeur | `router.init({routes: [...]})` |
| `push(name, query)` | Navigue vers une route | `router.push('home', {tab: 'main'})` |
| `replace(name, query)` | Remplace la route actuelle | `router.replace('login')` |
| `back()` | Retour en arrière | `router.back()` |
| `addRoute(name, path, options)` | Ajoute une route | `router.addRoute('new', 'page.html')` |
| `addRoutes(routes)` | Ajoute plusieurs routes | `router.addRoutes([...])` |
| `use(middleware)` | Ajoute un middleware global | `router.use(authMiddleware)` |
| `getCurrentRoute()` | Récupère la route actuelle | `const route = router.getCurrentRoute()` |

### Options de configuration

| Option | Type | Défaut | Description |
|--------|------|---------|-------------|
| `routes` | Array | `[]` | Liste des routes |
| `routerViewId` | String | `'#router-view'` | Sélecteur de l'élément conteneur |
| `defaultRoute` | String | `'home'` | Route par défaut |
| `notFoundPage` | String | `null` | Page 404 personnalisée |
| `baseUrl` | String | `''` | URL de base pour les fichiers |
| `loadingOptions.showLoading` | Boolean | `true` | Afficher le loader |
| `loadingOptions.loadingDelay` | Number | `300` | Délai du loader (ms) |

### Structure d'une route

```javascript
{
    name: "route-name",           // Nom unique de la route
    path: "pages/file.html",      // Chemin du fichier HTML
    component: ComponentFunction, // OU fonction composant
    beforeEnter: guardFunction,   // Guard de route (optionnel)
    meta: {                       // Métadonnées (optionnel)
        title: "Page Title",
        requiresAuth: true,
        customData: "value"
    }
}
```

## 🎨 Personnalisation du loader

Le loader par défaut peut être personnalisé via CSS :

```css
.router-loading {
    /* Styles du conteneur de chargement */
}

.loading-spinner {
    /* Styles du spinner */
    border-color: #your-color !important;
}

.router-error {
    /* Styles des erreurs */
    background-color: #your-error-bg;
}
```

## 🔍 Débogage

Activez les logs pour déboguer :

```javascript
// Middleware de débogage
router.use((context) => {
    console.log('Navigation:', {
        from: context.from?.name,
        to: context.name,
        query: context.query
    });
});
```

## 🚨 Gestion d'erreurs

```javascript
// Middleware de gestion d'erreurs
router.use((context) => {
    try {
        // Votre logique
        return true;
    } catch (error) {
        console.error('Erreur de navigation:', error);
        router.push('error');
        return false;
    }
});
```

## 📱 Compatibilité

- ✅ Tous les navigateurs modernes
- ✅ IE11+ (avec polyfills pour fetch si nécessaire)
- ✅ Applications mobiles (PhoneGap/Cordova)
- ✅ Electron

## 🤝 Contribution

Pour contribuer à ce projet :

1. Forkez le repository
2. Créez une branche feature
3. Committez vos changements
4. Créez une Pull Request

## 📄 Licence

MIT License - Libre d'utilisation pour tous projets.

---

## FAQ

**Q: Comment gérer les routes imbriquées ?**
* R: Utilisez des noms de routes avec `/` : `{ name: "admin/users", path: "pages/admin/users.html" }`

**Q: Peut-on utiliser des paramètres dans l'URL ?**
* R: Oui, via les query parameters : `#/product?id=123`

**Q: Comment synchroniser avec l'historique du navigateur ?**
* R: Le routeur utilise automatiquement l'API History du navigateur.

**Q: Performance avec beaucoup de routes ?**
* R: Le routeur utilise une Map() pour des performances optimales même avec des milliers de routes.