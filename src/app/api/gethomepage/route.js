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
        const url = new URL(request.url);
        const voterId = url.searchParams.get('voterId');
        let overrideMode = null;
        if(voterId) {
            const [fingerprint, salt] = voterId.split('-');

            function isValidFingerprint(fingerprint) {
                return typeof fingerprint === 'string' && fingerprint.length > 0;
            }
    
            function isValidSalt(salt) {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                return uuidRegex.test(salt);
            }
    
            if (!isValidFingerprint(fingerprint) || !isValidSalt(salt)) {
                overrideMode = 'alreadyVoted';
            }
        }
        
        const q = db.collection('config').where('name', '==', 'homepage');
        const querySnapshot = await q.get();
        let dataSend = {};

        querySnapshot.forEach((doc) => {
            const dataDb = doc.data();
            if (dataDb.value && dataDb.value.mode) {
                dataSend.mode = overrideMode || dataDb.value.mode;
            }
            if (dataDb.value && dataDb.value.registerBtn_name) {
                dataSend.registerBtn_name = dataDb.value.registerBtn_name;
            }
            if (dataDb.value && dataDb.value.tabTitle) {
                dataSend.tabTitle = dataDb.value.tabTitle;
            }
            if (dataDb.value && dataDb.value.title) {
                dataSend.title = dataDb.value.title;
            }
            if (dataDb.value && dataDb.value.votingoptions) {
                dataSend.votingoptions = dataDb.value.votingoptions;
            }
            if (dataDb.value && dataDb.value.thankYou) {
                dataSend.thankYou = dataDb.value.thankYou;
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