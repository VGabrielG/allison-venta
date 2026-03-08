import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCeJb3Hl4zlq7ZlZA8jQhdS9xUTJAf2STI",
  authDomain: "allison-venta.firebaseapp.com",
  projectId: "allison-venta",
  storageBucket: "allison-venta.firebasestorage.app",
  messagingSenderId: "1041023333784",
  appId: "1:1041023333784:web:4f131f150abb68d5c6e7ed",
  measurementId: "G-83JD8H7P87"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkHogar() {
    console.log('--- Checking Hogar Products in Firestore ---');
    const q = query(collection(db, 'products'), where('category', '==', 'hogar'));
    const snapshot = await getDocs(q);
    
    snapshot.forEach(d => {
        const data = d.data();
        console.log(`- ${data.title}: ${data.imageUrl}`);
    });
    
    console.log(`Total Hogar products: ${snapshot.size}`);
    process.exit(0);
}

checkHogar();
