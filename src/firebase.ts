import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Bỏ dòng này nếu không dùng lưu ảnh

const firebaseConfig = {
  apiKey: "AIzaSyA1...", // Dán key của bạn vào đây
  authDomain: "thanhly-xxx.firebaseapp.com",
  projectId: "thanhly-xxx",
  storageBucket: "thanhly-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:12345:web:abcd"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo và export các dịch vụ để sử dụng ở file khác
export const db = getFirestore(app);
export const storage = getStorage(app);
