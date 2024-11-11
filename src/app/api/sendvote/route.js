import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = require('../../../../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = getFirestore();

export async function POST(request) {
    try {
        const data = await request.json();

        function isValidVoterId(voterId) {
            const regex = /^[0-9a-f]{7}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return regex.test(voterId);
        }

        let alreadyVoted = false;
        const qAlready = db.collection('voters').where('voterId', '==', data.voterId);
        const querySnapshotAlready = await qAlready.get();

        if (!querySnapshotAlready.empty) alreadyVoted = true;

        if (alreadyVoted) {
            console.log('User has already voted');
            return new Response(JSON.stringify({ message: 'User has already voted' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!isValidVoterId(data.voterId)) {
            console.log('Invalid voter ID');
            return new Response(JSON.stringify({ message: 'Invalid voter ID' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        let setData = {
            voterId: data.voterId,
            timestamp: new Date(),
            votedOn: data.index
        };

        const docRef = db.collection('voters').doc();
        await docRef.set(setData);

        const configRef = db.collection('config').where('name', '==', 'homepage');
        const configSnapshot = await configRef.get();

        if (!configSnapshot.empty) {
            configSnapshot.forEach(async (doc) => {
                const configData = doc.data();
                configData.value.votingoptions[data.index].votes += 1;
                await doc.ref.update(configData);
            });
        }

        return new Response(JSON.stringify({ message: 'Vote registered' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error processing request:', error);
        return new Response(JSON.stringify({ message: 'Error processing request' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}