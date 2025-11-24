import React from "react";

const Joystick = ({ onMove }) => {
  // Style chung cho các nút
  const btnStyle =
    "w-12 h-12 bg-slate-700/80 border-2 border-slate-500 rounded-full active:bg-green-600 active:border-green-400 flex items-center justify-center text-xl text-white select-none touch-manipulation shadow-lg";

  return (
    // Hiển thị inline trong layout, không fixed
    <div className="flex flex-col items-center gap-1 select-none">
      {/* Nút Lên */}
      <button className={btnStyle} onClick={() => onMove("up")}>
        ▲
      </button>

      <div className="flex gap-4">
        {/* Nút Trái */}
        <button className={btnStyle} onClick={() => onMove("left")}>
          ◀
        </button>

        {/* Nút Giữa (Trang trí hoặc nút OK) */}
        <div className="w-12 h-12 bg-slate-800/50 rounded-full"></div>

        {/* Nút Phải */}
        <button className={btnStyle} onClick={() => onMove("right")}>
          ▶
        </button>
      </div>

      {/* Nút Xuống */}
      <button className={btnStyle} onClick={() => onMove("down")}>
        ▼
      </button>
    </div>
  );
};

export default Joystick;
