/**
 * Simple Hash Router - Version 1.0
 * Un routeur côté client simple utilisant les hash pour la navigation
 * Compatible avec tous les navigateurs modernes
 */

(function(global) {
    'use strict';

    // Utilitaires pour le routage
    const RouterUtils = {
        /**
         * Parse l'URL hash et retourne le chemin et les paramètres de requête
         * @returns {Object} { path: string, query: Object }
         */
        parseHashRoute: function() {
            let hash = window.location.hash.startsWith("#/") 
                ? window.location.hash.slice(2) 
                : "";
            
            const [path, queryStr] = hash.split("?");
            const query = {};
            
            if (queryStr) {
                queryStr.split("&").forEach(pair => {
                    const [key, val] = pair.split("=");
                    if (key) {
                        query[key] = decodeURIComponent(val || "");
                    }
                });
            }
            
            return { 
                path: path || "", 
                query: query 
            };
        },

        /**
         * Charge du contenu HTML dans un élément cible
         * @param {string} targetSelector - Sélecteur CSS de l'élément cible
         * @param {string} fileUrl - URL du fichier à charger
         * @param {Object} options - Options de chargement
         */
        loadContent: function(targetSelector, fileUrl, options = {}) {
            const target = document.querySelector(targetSelector);
            if (!target) {
                console.error(`Élément cible non trouvé: ${targetSelector}`);
                return;
            }

            const showLoading = options.showLoading !== false;
            const loadingDelay = options.loadingDelay || 300;

            // Afficher le loader si activé
            if (showLoading) {
                target.innerHTML = `
                    <div class="router-loading" style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 200px;
                        flex-direction: column;
                        gap: 15px;
                    ">
                        <div class="loading-spinner" style="
                            width: 40px;
                            height: 40px;
                            border: 3px solid #f3f3f3;
                            border-top: 3px solid #3498db;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                        "></div>
                        <div style="color: #666;">Chargement...</div>
                    </div>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                `;
            }

            // Charger le contenu
            fetch(fileUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.text();
                })
                .then(html => {
                    const displayContent = () => {
                        target.innerHTML = html;
                        // Exécuter les scripts dans le contenu chargé
                        RouterUtils.executeScripts(target);
                    };

                    if (showLoading && loadingDelay > 0) {
                        setTimeout(displayContent, loadingDelay);
                    } else {
                        displayContent();
                    }
                })
                .catch(error => {
                    console.error('Erreur lors du chargement:', error);
                    target.innerHTML = `
                        <div class="router-error" style="
                            padding: 20px;
                            text-align: center;
                            color: #e74c3c;
                            background-color: #fdf2f2;
                            border: 1px solid #f5b7b1;
                            border-radius: 5px;
                            margin: 20px 0;
                        ">
                            <h3>Erreur de chargement</h3>
                            <p>Impossible de charger la page: ${fileUrl}</p>
                            <small>${error.message}</small>
                        </div>
                    `;
                });
        },

        /**
         * Exécute les scripts présents dans un élément DOM
         * @param {Element} container - Conteneur contenant les scripts
         */
        executeScripts: function(container) {
            const scripts = container.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                if (script.src) {
                    newScript.src = script.src;
                } else {
                    newScript.textContent = script.textContent;
                }
                document.head.appendChild(newScript);
                document.head.removeChild(newScript);
            });
        }
    };

    /**
     * Classe principale du routeur
     */
    class HashRouter {
        constructor() {
            this.routes = new Map();
            this.middlewares = [];
            this.config = {
                routerViewId: '#router-view',
                defaultRoute: 'home',
                notFoundPage: null,
                baseUrl: '',
                loadingOptions: {
                    showLoading: true,
                    loadingDelay: 300
                }
            };
            this.currentRoute = null;
            this.isInitialized = false;
        }

        /**
         * Initialise le routeur avec la configuration
         * @param {Object} options - Options de configuration
         */
        init(options = {}) {
            // Fusionner la configuration
            this.config = { ...this.config, ...options };
            
            // Normaliser les routes
            if (options.routes) {
                this.addRoutes(options.routes);
            }

            // Ajouter les écouteurs d'événements
            this._setupEventListeners();
            
            this.isInitialized = true;
            
            // Gérer la route initiale
            this._handleRouteChange();
            
            console.log('HashRouter initialisé avec', this.routes.size, 'routes');
        }

        /**
         * Ajoute plusieurs routes
         * @param {Array} routes - Tableau de routes { name, path, component?, beforeEnter?, meta? }
         */
        addRoutes(routes) {
            if (!Array.isArray(routes)) {
                console.error('Les routes doivent être un tableau');
                return;
            }

            routes.forEach(route => {
                if (!route.name || !route.path) {
                    console.error('Route invalide:', route);
                    return;
                }
                
                this.routes.set(route.name, {
                    name: route.name,
                    path: route.path,
                    component: route.component,
                    beforeEnter: route.beforeEnter,
                    meta: route.meta || {}
                });
            });
        }

        /**
         * Ajoute une route unique
         * @param {string} name - Nom de la route
         * @param {string} path - Chemin du fichier
         * @param {Object} options - Options additionnelles
         */
        addRoute(name, path, options = {}) {
            this.routes.set(name, {
                name,
                path,
                component: options.component,
                beforeEnter: options.beforeEnter,
                meta: options.meta || {}
            });
        }

        /**
         * Ajoute un middleware global
         * @param {Function} middleware - Fonction middleware
         */
        use(middleware) {
            if (typeof middleware === 'function') {
                this.middlewares.push(middleware);
            }
        }

        /**
         * Navigue vers une route
         * @param {string} routeName - Nom de la route
         * @param {Object} query - Paramètres de requête
         */
        push(routeName, query = {}) {
            let hash = `#/${routeName}`;
            
            const queryString = Object.keys(query)
                .map(key => `${key}=${encodeURIComponent(query[key])}`)
                .join('&');
            
            if (queryString) {
                hash += `?${queryString}`;
            }
            
            window.location.hash = hash;
        }

        /**
         * Remplace la route actuelle
         * @param {string} routeName - Nom de la route
         * @param {Object} query - Paramètres de requête
         */
        replace(routeName, query = {}) {
            this.push(routeName, query);
        }

        /**
         * Retourne à la page précédente
         */
        back() {
            window.history.back();
        }

        /**
         * Obtient la route actuelle
         * @returns {Object} Route actuelle
         */
        getCurrentRoute() {
            return this.currentRoute;
        }

        /**
         * Configure les écouteurs d'événements
         * @private
         */
        _setupEventListeners() {
            window.addEventListener('hashchange', () => this._handleRouteChange());
            window.addEventListener('load', () => this._handleRouteChange());
        }

        /**
         * Gère le changement de route
         * @private
         */
        async _handleRouteChange() {
            if (!this.isInitialized) return;

            const { path, query } = RouterUtils.parseHashRoute();
            const routeName = path || this.config.defaultRoute;
            const route = this.routes.get(routeName);

            // Créer le contexte de route
            const context = {
                name: routeName,
                path: path,
                query: query,
                params: {},
                meta: route ? route.meta : {},
                from: this.currentRoute
            };

            // Exécuter les middlewares
            const shouldContinue = await this._executeMiddlewares(context);
            if (!shouldContinue) return;

            // Exécuter le guard de route
            if (route && route.beforeEnter) {
                const canEnter = await this._executeGuard(route.beforeEnter, context);
                if (!canEnter) return;
            }

            // Charger la route
            if (route) {
                this._loadRoute(route, context);
            } else {
                this._handleNotFound(context);
            }

            this.currentRoute = context;
        }

        /**
         * Exécute les middlewares
         * @private
         */
        async _executeMiddlewares(context) {
            for (const middleware of this.middlewares) {
                try {
                    const result = await middleware(context);
                    if (result === false) return false;
                } catch (error) {
                    console.error('Erreur dans le middleware:', error);
                    return false;
                }
            }
            return true;
        }

        /**
         * Exécute un guard de route
         * @private
         */
        async _executeGuard(guard, context) {
            try {
                const result = await guard(context);
                return result !== false;
            } catch (error) {
                console.error('Erreur dans le guard de route:', error);
                return false;
            }
        }

        /**
         * Charge une route
         * @private
         */
        _loadRoute(route, context) {
            const fullPath = this.config.baseUrl + route.path;
            
            if (route.component) {
                // Si c'est un composant
                const target = document.querySelector(this.config.routerViewId);
                if (target) {
                    target.innerHTML = route.component(context);
                }
            } else {
                // Si c'est un fichier HTML
                RouterUtils.loadContent(
                    this.config.routerViewId, 
                    fullPath, 
                    this.config.loadingOptions
                );
            }
        }

        /**
         * Gère les routes non trouvées
         * @private
         */
        _handleNotFound(context) {
            if (this.config.notFoundPage) {
                const fullPath = this.config.baseUrl + this.config.notFoundPage;
                RouterUtils.loadContent(
                    this.config.routerViewId, 
                    fullPath, 
                    this.config.loadingOptions
                );
            } else {
                // Rediriger vers la route par défaut
                this.push(this.config.defaultRoute);
            }
        }
    }

    // Créer une instance globale
    const router = new HashRouter();

    // Exposer le routeur globalement
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = router;
    } else {
        global.router = router;
        global.HashRouter = HashRouter;
    }

})(typeof window !== 'undefined' ? window : this);