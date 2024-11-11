import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
dotenv.config();

const serviceAccount = require('../../../../serviceAccountKey.json');

if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount)
	});
}

export async function POST(request) {
	try {
		
		const storage = getStorage();
		const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);

		const formData = await request.formData();
		const files = formData.getAll('files');

		const uploadPromises = files.map(async (file) => {
			const arrayBuffer = await file.arrayBuffer();
			const fileBuffer = Buffer.from(arrayBuffer);
			const fileName = `awaiting/${file.name}`;
			const fileRef = bucket.file(fileName);
			await fileRef.save(fileBuffer, {
				metadata: {
					contentType: file.type
				}
			});
		});

		await Promise.all(uploadPromises);

		return new Response(JSON.stringify({ message: 'Files uploaded successfully' }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		console.error('Error uploading files to Firebase Storage:', error);
		return new Response(JSON.stringify({ error: 'Failed to upload files' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
}