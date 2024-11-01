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

app.get('/api/category', async (req, res) => {
    const cata = [{
        img: 'https://firebasestorage.googleapis.com/v0/b/backend-ku-uniform-hub.appspot.com/o/2.png?alt=media&token=0ff89471-b9fd-46bc-9dad-64a99475e071',
        name: 'เสื้อนักศึกษาหญิง',
        price: 250.00
      },{
        img: "https://firebasestorage.googleapis.com/v0/b/backend-ku-uniform-hub.appspot.com/o/3.png?alt=media&token=b2d10cbd-5d24-4249-9fa4-c6a4712021c3",
        name: 'เสื้อเเจคเกต เกษตรศาสตร์',
        price: 799.00
      },{
        img: '',
        name: '',
        price: 0
      },{
        img: '',
        name: '',
        price: 0
      },{
        img: '',
        name: '',
        price: 0
      }]
      res.status(200).json({cata: cata})
})

const port = process.env.PORT || 4000
app.listen(port, () => {
    console.log(`https://localhost:${port}`)
})