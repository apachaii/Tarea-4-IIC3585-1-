const fs = require('fs');


const urlSafeBase64 = require('urlsafe-base64');
const vapid = require('./vapid.json');

const webpush = require('web-push');

webpush.setVapidDetails(
    'mailto:fernando.herrera85@gmail.com',
    vapid.publicKey,
    vapid.privateKey
);


let subscriptions = require('./subs-db.json');


module.exports.getKey = () => {
    return urlSafeBase64.decode(vapid.publicKey);
};


module.exports.addSubscription = (suscripcion) => {

    subscriptions.push(suscripcion);


    fs.writeFileSync(`${__dirname}/subs-db.json`, JSON.stringify(subscriptions));
};


module.exports.sendPush = (post) => {

    console.log('Mandando PUSHES');

    const notificacionesEnviadas = [];


    subscriptions.forEach((suscripcion, i) => {


        const pushProm = webpush.sendNotification(suscripcion, JSON.stringify(post))
            .then(console.log('Notificacion enviada '))
            .catch(err => {

                console.log('Notificación falló');

                if (err.statusCode === 410) { // GONE, ya no existe
                    subscriptions[i].borrar = true;
                }

            });

        notificacionesEnviadas.push(pushProm);

    });

    Promise.all(notificacionesEnviadas).then(() => {

        subscriptions = subscriptions.filter(subs => !subs.borrar);

        fs.writeFileSync(`${__dirname}/subs-db.json`, JSON.stringify(subscriptions));

    });

}

