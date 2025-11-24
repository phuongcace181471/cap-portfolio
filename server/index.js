const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const nodemailer = require("nodemailer"); // 👇 Thêm dòng này
const Message = require("./models/Message"); // 👇 Thêm dòng này
const Profile = require("./models/Profile"); // Import cái khuôn mẫu vừa tạo

const app = express();
const PORT = process.env.PORT || 2408;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:2004", "https://cap-portfolio-blush.vercel.app"],
  })
);
app.use(express.json());

// 1. KẾT NỐI MONGODB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("🔥 Đã kết nối MongoDB Atlas thành công!"))
  .catch((err) => console.error("🔴 Lỗi kết nối MongoDB:", err));

// 2. API: Lấy thông tin Profile (Cho Máy tính trong game gọi)
app.get("/api/profile", async (req, res) => {
  try {
    // Lấy profile đầu tiên tìm thấy
    const profile = await Profile.findOne();
    if (!profile) return res.status(404).json({ msg: "Chưa có dữ liệu CV" });
    res.json(profile);
  } catch (err) {
    res.status(500).send("Lỗi Server");
  }
});

// 3. API: "Gieo mầm" dữ liệu mẫu (Chạy 1 lần để có data)
app.get("/api/seed", async (req, res) => {
  try {
    // Xóa hết dữ liệu cũ (nếu có) để tránh trùng lặp
    await Profile.deleteMany({});

    // Tạo dữ liệu mới của CAP
    const newProfile = new Profile({
      name: "Chương Anh Phương",
      title: "Fullstack Web Developer",
      bio: "Sinh viên đam mê lập trình, thích Gấu trúc và Code dạo.",
      skills: ["React.js", "Node.js", "MongoDB", "Tailwind CSS"],
      projects: [
        {
          name: "CAP Portfolio RPG",
          desc: "Web giới thiệu bản thân phong cách Game",
          tech: "MERN Stack",
        },
        {
          name: "Rơm làm than",
          desc: "Dự án Startup chuyển đổi rơm rạ",
          tech: "Business",
        },
      ],
      socials: {
        github: "https://github.com/cap",
        email: "cap@example.com",
        facebook: "fb.com/cap",
      },
    });

    await newProfile.save();
    res.send("🟢 Đã khởi tạo dữ liệu mẫu cho CAP thành công!");
  } catch (err) {
    res.status(500).send("Lỗi tạo data: " + err.message);
  }
});

app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    // 1. Lưu vào Database trước (Backup)
    const newMessage = new Message({ name, email, message });
    await newMessage.save();

    // 2. Cấu hình Nodemailer (SỬA LẠI ĐOẠN NÀY)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // 👇 THÊM ĐOẠN NÀY ĐỂ FIX LỖI SSL
      tls: {
        rejectUnauthorized: false,
      },
    });

    // 3. Gửi mail
    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Gửi cho chính mình
      subject: `📩 Tin nhắn mới từ ${name}`,
      text: `Người gửi: ${name} (${email})\n\nNội dung:\n${message}`,
    });

    res.json({ success: true, msg: "Đã gửi mail thành công!" });
  } catch (err) {
    console.error("Lỗi gửi mail:", err);
    res
      .status(500)
      .json({ success: false, msg: "Lỗi server, vui lòng thử lại." });
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
