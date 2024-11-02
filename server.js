const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
    credential: cert(serviceAccount),
});

const db = getFirestore();
const auth = getAuth();

app.post('/api/signup', async (req, res) => {
    try {
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

        res.status(201).json({ message: 'User created successfully.', uid: userRecord.uid });
    } catch (error) {
        res.status(400).json({ message: 'Error creating user.', error: error.message });
    }
});

app.get('/api/category', async (req, res) => {
    try {
        const productsRef = db.collection('products');
        const snapshot = await productsRef.get();

        const cata = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                img: data.image || '',
                name: data.productname || '',
                price: data.price || 0,
                id: doc.id  // เพิ่ม id เพื่อใช้ในฝั่ง frontend
            };
        });

        res.status(200).json({ cata });
    } catch (error) {
        console.error("Error retrieving products:", error);
        res.status(500).send("Error retrieving products");
    }
});

// POST สำหรับการเพิ่มสินค้าใน cart และอัปเดตจำนวน
app.post('/api/category', async (req, res) => {
    try {
        const { userId, productName } = req.body;

        if (!userId || !productName) {
            return res.status(400).json({ message: 'User ID and Product Name are required.' });
        }

        const userCartRef = db.collection('users').doc(userId).collection('cart');
        const cartSnapshot = await userCartRef.where('name', '==', productName).get();

        if (!cartSnapshot.empty) {
            // ถ้าสินค้ามีอยู่แล้วใน cart ให้เพิ่มจำนวน
            const cartDoc = cartSnapshot.docs[0];
            await cartDoc.ref.update({
                quantity: FieldValue.increment(1)
            });
        } else {
            // ถ้าไม่มีสินค้าใน cart ให้เพิ่มสินค้าลงใน cart
            const productRef = db.collection('products').where('productname', '==', productName);
            const productSnapshot = await productRef.get();

            if (!productSnapshot.empty) {
                const product = productSnapshot.docs[0].data();
                await userCartRef.add({
                    name: product.productname,
                    img: product.image,
                    price: product.price,
                    addedAt: new Date().toISOString(),
                    quantity: 1
                });
            } else {
                return res.status(400).json({ message: 'Product not found.' });
            }
        }

        res.status(201).json({ message: 'Product added to cart successfully.' });
    } catch (error) {
        console.error("Error adding product to cart:", error);
        res.status(500).json({ message: 'Error adding product to cart.' });
    }
});





app.post('/api/cart', async (req, res) => {
    try {
        const { userId, product } = req.body;

        // ตรวจสอบว่า userId ถูกต้องหรือไม่
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        // ตรวจสอบว่า product มีข้อมูลครบถ้วนหรือไม่
        if (!product || !product.name || !product.price) {
            return res.status(400).json({ message: 'Product information is incomplete.' });
        }

        // เพิ่มสินค้าลงในคอลเลกชันย่อย 'users/{userId}/cart'
        await db.collection('users').doc(userId).collection('cart').add(product);

        // ตรวจสอบว่ามีคอลเลกชัน category ภายใต้เอกสารของผู้ใช้หรือไม่ ถ้าไม่มีให้สร้างใหม่
        const userCategoryRef = db.collection('users').doc(userId).collection('cart');
        const categorySnapshot = await userCategoryRef.where('name', '==', product.name).get();

        if (categorySnapshot.empty) {
            await userCategoryRef.add({
                name: product.name,
                img: product.img,
                price: product.price,
                addedAt: new Date().toISOString(),
            });
        }

        res.status(201).json({ message: 'Product added to cart successfully and category created/updated.' });
    } catch (error) {
        console.error("Error adding product to cart:", error);
        res.status(500).json({ message: 'Error adding product to cart.' });
    }
});

app.post('/api/verify-token', async (req, res) => {
    try {
        const { idToken } = req.body;
        const decodedToken = await auth.verifyIdToken(idToken);
        res.status(200).json({ message: 'Token verified successfully.', uid: decodedToken.uid });
    } catch (error) {
        console.error("Error verifying token:", error);
        res.status(400).json({ message: 'Invalid token.' });
    }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});




