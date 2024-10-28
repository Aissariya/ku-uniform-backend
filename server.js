const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors());
app.use(express.json());

const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const serviceAccount = require('./serviceAccountKey.json')
initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

app.post('/api/signup', async (req, res) => {
    try{
        const { email, password, firstname, lastname } = req.body;
        
        const user = await auth.getUserByEmail(email).catch(() => null);
        if (user) {
            return res.status(400).send({
                message: 'Error creating user',
                error: 'The email address is already in use by another account.',
            });
        }
        
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: `${firstname} ${lastname}`,
        });

        await db.collection('users').doc(userRecord.uid).set({
            firstname: firstname,
            lastname: lastname,
            email: email,
            createdAt: new Date(),
        });

        res.status(201).json({message: 'User created successfully.', uid: ''})
    }catch(error){
        res.status(400).json({message: 'Error creating user.', error: error.message})
    }
})

const port = process.env.PORT || 4000
app.listen(port, () => {
    console.log(`https://localhost:${port}`)
})