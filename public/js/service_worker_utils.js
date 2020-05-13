function updateDynamicCache(dynamicCache, req, res) {

    if (res.ok) {
        return caches.open(dynamicCache).then(cache => {
            cache.put(req, res.clone());
            return res.clone();
        });
    }

    return res;
}

// Cache with network update
function updateStaticCache(staticCache, req, APP_SHELL_IMMUTABLE) {

    if (APP_SHELL_IMMUTABLE.includes(req.url)) {
        // No hace falta actualizar el inmutable
        // console.log('existe en inmutable', req.url );

    } else {
        // console.log('actualizando', req.url );
        return fetch(req)
            .then(res => {
                return updateDynamicCache(staticCache, req, res);
            });
    }


}


// Network with cache fallback / update
function manejoApiMensajes(cacheName, req) {


    if ((req.url.indexOf('/api/key') >= 0) || req.url.indexOf('/api/subscribe') >= 0) {

        return fetch(req);

    } else if (req.clone().method === 'POST') {
        // POSTEO de un nuevo mensaje

        if (self.registration.sync) {
            return req.clone().text().then(body => {

                // console.log(body);
                const bodyObj = JSON.parse(body);
                return saveMessage(bodyObj);

            });
        } else {
            return fetch(req);
        }


    } else {

        return fetch(req).then(res => {

            if (res.ok) {
                updateDynamicCache(cacheName, req, res.clone());
                return res.clone();
            } else {
                return caches.match(req);
            }

        }).catch(err => {
            return caches.match(req);
        });

    }


}

