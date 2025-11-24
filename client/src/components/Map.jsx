// client/src/components/Map.jsx
import React from "react";
import { CELL_SIZE } from "../constants";

const MapCell = ({ cell }) => {
  let content = null;
  let bgClass = "bg-emerald-900";

  if (cell === 1) {
    bgClass = "bg-slate-700";
  } else if (cell === 2) {
    content = (
      <div className="text-3xl flex items-center justify-center w-full h-full">
        🦸‍♂️
      </div>
    );
  } else if (cell === 3) {
    content = (
      <div className="text-3xl flex items-center justify-center w-full h-full">
        ⚔️
      </div>
    );
  } else if (cell === 4) {
    content = (
      <div className="text-3xl flex items-center justify-center w-full h-full">
        🏆
      </div>
    );
  } else if (cell === 5) {
    content = (
      <div className="text-3xl flex items-center justify-center w-full h-full">
        🌍
      </div>
    );
  } else if (cell === 6) {
    content = (
      <div className="text-3xl flex items-center justify-center w-full h-full">
        📬
      </div>
    );
  }

  return { content, bgClass };
};

const GameMap = ({ mapMatrix }) => {
  return (
    <>
      {/* Mobile version: Full width responsive */}
      <div
        className="lg:hidden relative shadow-2xl border-slate-700 w-full h-auto"
        style={{
          aspectRatio: `${mapMatrix[0].length} / ${mapMatrix.length}`,
        }}
      >
        {mapMatrix.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex w-full"
            style={{ height: `${100 / mapMatrix.length}%` }}
          >
            {row.map((cell, colIndex) => {
              const { content, bgClass } = MapCell({ cell });

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  style={{ width: `${100 / mapMatrix[0].length}%` }}
                  className={`border border-white/5 box-border ${bgClass} h-full`}
                >
                  {content}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Desktop version: Fixed size */}
      <div
        className="hidden lg:block relative shadow-2xl border-4 border-slate-700"
        style={{
          width: mapMatrix[0].length * CELL_SIZE,
          height: mapMatrix.length * CELL_SIZE,
        }}
      >
        {mapMatrix.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => {
              const { content, bgClass } = MapCell({ cell });

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                  className={`border border-white/5 box-border ${bgClass}`}
                >
                  {content}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
};

export default GameMap;
