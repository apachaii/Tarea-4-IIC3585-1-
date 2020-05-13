// to record PouchDB
const db = new PouchDB('mensajes');

const newPostTag = 'new-post';

function saveMessage(message) {

    message._id = new Date().toISOString();

    return db.put(message).then(() => {
        self.registration.sync.register(newPostTag);
        const newResp = {ok: true, offline: true};
        return new Response(JSON.stringify(newResp));
    });
}

function postMessages() {

    const posts = [];

    return db.allDocs({include_docs: true}).then(docs => {

        docs.rows.forEach(row => {
            const doc = row.doc;

            const fetchPom = fetch('api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(doc)
            }).

            then(_ => {
                return db.remove(doc);
            });

            posts.push(fetchPom);
        }); // fin del foreach

        return Promise.all(posts);

    });
}

