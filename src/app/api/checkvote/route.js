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
        const q = db.collection('voters').where('voterId', '==', voterId);
        const querySnapshot = await q.get();
        let dataSend = { alreadyVoted: false };

        if(!querySnapshot.empty) {
            dataSend.alreadyVoted = true;
        }

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