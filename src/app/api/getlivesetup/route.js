import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = require('../../../../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = getFirestore();

export async function GET(request) {
    try {
        let dataSend = {};

        const qLive = db.collection('config').where('name', '==', 'live');
        const querySnapshotLive = await qLive.get();

        querySnapshotLive.forEach((doc) => {
            const dataDb = doc.data();
            if (dataDb.value.title) {
                dataSend.title = dataDb.value.title;
            }
            if (dataDb.value.showFirstX) {
                dataSend.showFirstX = dataDb.value.showFirstX;
            }
            if (dataDb.value.moreRedacted) {
                dataSend.moreRedacted = dataDb.value.moreRedacted;
            }
            if (dataDb.value.tabTitle) {
                dataSend.tabTitle = dataDb.value.tabTitle;
            }
            if (dataDb.value.buttonSubtext) {
                dataSend.buttonSubtext = dataDb.value.buttonSubtext;
            }
        });

        const qFooter = db.collection('config').where('name', '==', 'footer');
        const querySnapshotFooter = await qFooter.get();

        querySnapshotFooter.forEach((doc) => {
            const dataDb = doc.data();
            if (dataDb.value) {
                dataSend.footer = dataDb.value;
            }
        });

        if (dataSend) {
            return new Response(JSON.stringify(dataSend), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } else {
            return new Response(JSON.stringify({ error: "Not Found" }), {
                status: 404,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    } catch (error) {
        console.error('Error fetching data from Firestore:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}