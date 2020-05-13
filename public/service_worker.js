// imports
importScripts('https://cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min.js')

importScripts('js/service_worker_database.js');
importScripts('js/service_worker_utils.js');


const STATIC_CACHE = 'static-v3';
const DYNAMIC_CACHE = 'dynamic-v1';
const IMMUTABLE_CACHE = 'inmutable-v1';


const APP_SHELL = [
    '/',
    'index.html',
    'css/style.css',
    'img/favicon.ico',
    'img/avatars/hulk.jpg',
    'img/avatars/ironman.jpg',
    'img/avatars/spiderman.jpg',
    'img/avatars/thor.jpg',
    'img/avatars/wolverine.jpg',
    'js/app.js',
    'js/camara-class.js',
    'js/service_worker_utils.js',
    'js/libs/plugins/mdtoast.min.js',
    'js/libs/plugins/mdtoast.min.css'
];

const APP_SHELL_IMMUTABLE = [
    'https://fonts.googleapis.com/css?family=Quicksand:300,400',
    'https://fonts.googleapis.com/css?family=Lato:400,300',
    'https://use.fontawesome.com/releases/v5.3.1/css/all.css',
    'https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.0/animate.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js',
    'https://cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min.js'
];


self.addEventListener('install', install_event => {
    const cacheStatic = caches.open(STATIC_CACHE).then(cache =>
        cache.addAll(APP_SHELL));
    const cacheImmutable = caches.open(IMMUTABLE_CACHE).then(cache =>
        cache.addAll(APP_SHELL_IMMUTABLE));

    install_event.waitUntil(Promise.all([cacheStatic, cacheImmutable]));
});


self.addEventListener('activate', activate_event => {

    const answer = caches.keys().then(keys => {

        keys.forEach(key => {

            if (key !== STATIC_CACHE && key.includes('static')) {
                return caches.delete(key);
            }

            if (key !== DYNAMIC_CACHE && key.includes('dynamic')) {
                return caches.delete(key);
            }

        });

    });

    activate_event.waitUntil(answer);

});


self.addEventListener('fetch', fetch_event => {

    let answer;

    if (fetch_event.request.url.includes('/api')) {
        // return answer????
        answer = manejoApiMensajes(DYNAMIC_CACHE, fetch_event.request);
    }

    else {
        answer = caches.match(fetch_event.request).then(res => {
            if (res) {
                updateStaticCache(STATIC_CACHE, fetch_event.request, APP_SHELL_IMMUTABLE);
                return res;

            }

            else {
                return fetch(fetch_event.request).then(newRes => {
                    return updateDynamicCache(DYNAMIC_CACHE, fetch_event.request, newRes);
                });
            }
        });
    }

    fetch_event.respondWith(answer);
});


self.addEventListener('sync', async_event => {

    console.log('SW: Sync');

    if (async_event.tag === newPostTag) {
        // post DB if connected
        const answer = postMessages();
        async_event.waitUntil(answer);
    }

});

self.addEventListener('push', push_event => {

    const data = JSON.parse(push_event.data.text());

    const title = data.titulo;

    const options = {
        body: data.cuerpo,
        // icon: 'img/icons/icon-72x72.png',
        icon: `img/avatars/${data.usuario}.jpg`,
        badge: 'img/favicon.ico',
        image: 'https://vignette.wikia.nocookie.net/marvelcinematicuniverse/images/5/5b/Torre_de_los_Avengers.png/revision/latest?cb=20150626220613&path-prefix=es',
        vibrate: [125, 75, 125, 275, 200, 275, 125, 75, 125, 275, 200, 600, 200, 600],
        openUrl: '/',
        data: {
            // url: 'https://google.com',
            url: '/',
            id: data.usuario
        },
        actions: [
            {
                action: 'thor-action',
                title: 'Thor',
                icon: 'img/avatar/thor.jpg'
            },
            {
                action: 'ironman-action',
                title: 'Ironman',
                icon: 'img/avatar/ironman.jpg'
            }
        ]
    };


    push_event.waitUntil(self.registration.showNotification(title, options));
});


// Cierra la notificacion
self.addEventListener('notificationclose', close_notification_event => {
    console.log('Notificación cerrada', close_notification_event);
});


self.addEventListener('notificationclick', click_event => {

    const notification = click_event.notification;

    const answer = clients.matchAll()
        .then(clientes => {

            let cliente = clientes.find(c => {
                return c.visibilityState === 'visible';
            });

            if (cliente !== undefined) {
                cliente.navigate(notification.data.url);
                cliente.focus();
            } else {
                clients.openWindow(notification.data.url);
            }

            return notification.close();

        });

    click_event.waitUntil(answer);
});
