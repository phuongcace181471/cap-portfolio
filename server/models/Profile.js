const mongoose = require("mongoose");

// Định nghĩa cấu trúc 1 Dự án
const ProjectSchema = new mongoose.Schema({
  name: String,
  desc: String,
  tech: String, // Ví dụ: "React, Node.js"
});

// Định nghĩa cấu trúc Profile chính
const ProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: String, // Ví dụ: Fullstack Developer
  bio: String, // Giới thiệu bản thân
  skills: [String], // Mảng các kỹ năng
  projects: [ProjectSchema], // Danh sách dự án
  socials: {
    github: String,
    facebook: String,
    email: String,
  },
});

module.exports = mongoose.model("Profile", ProfileSchema);
