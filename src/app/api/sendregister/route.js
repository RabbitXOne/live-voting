import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
dotenv.config();

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
        if (!data) {
            return new Response(JSON.stringify({ message: 'No data received' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        console.log(data);

        const docRef = await db.collection('applications').add({ data });
        console.log('Document written with ID:', docRef.id);

        if (Array.isArray(data.form) && data.form.filter(item => item.type === 'uploadfile').length > 0) {
            const storage = getStorage();
            const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
            const movePromises = data.form.filter(item => item.type === 'uploadfile')[0].value.map(async (file) => {
                const sourceFileName = `awaiting/${file.path.split('/').pop()}`;
                const destinationFileName = `applications/${docRef.id}/${file.path.split('/').pop()}`;
                const sourceFile = bucket.file(sourceFileName);

                try {
                    await sourceFile.move(destinationFileName);
                    console.log(`File ${sourceFileName} moved to ${destinationFileName}`);
                } catch (error) {
                    console.error(`Error moving file ${sourceFileName} to ${destinationFileName}:`, error);
                }
            });

            await Promise.allSettled(movePromises);
        }

        return new Response(JSON.stringify({ message: 'Data received successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error processing request:', error.toString());
        return new Response(JSON.stringify({ message: 'Error processing request' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}