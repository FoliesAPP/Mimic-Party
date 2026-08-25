"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameEngine } from "@/game/GameEngine";
import { AchievementId, CreatureData, Difficulty, GameState, HUDState, LevelStats } from "@/types/game";

const DEFAULT_HUD: HUDState = {
  hp: 100, maxHp: 100, energy: 100, maxEnergy: 100, score: 0, level: 1,
  creatureName: "", element: "fire",
  colors: { primary: "#FF4500", secondary: "#FF8C00", accent: "#FFD700" },
  boss: null,
  
};

function stopEngine(engine: GameEngine | null) {
  if (!engine) return;
  try {
    if (typeof engine.stop === "function") { engine.stop(); return; }
    engine.destroy();
  } catch (error) {
    console.warn("Unable to stop game engine before navigation.", error);
  }
}

export function useGameEngine(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  onAchievement?: (id: AchievementId) => void
) {
  const engineRef  = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>("menu");
  const [hud,       setHud]       = useState<HUDState>(DEFAULT_HUD);
  const [levelStats, setLevelStats] = useState<LevelStats | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, {
      onStateChange:  (state) => setGameState(state),
      onHUDUpdate:    (h)     => setHud(h),
      onStatsReady:   (stats) => setLevelStats(stats),
      onAchievement,
    });
    engineRef.current = engine;

    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))
        e.preventDefault();

      if (e.key === "Escape") {
        const eng = engineRef.current;
        if (!eng) return;
        setGameState((prev) => {
          if (prev === "playing") { eng.pause(); return prev; }
          if (prev === "paused")  { eng.resume(); return prev; }
          return prev;
        });
        return;
      }

      engine.handleKeyDown(e.key);
    };
    const onKeyUp = (e: KeyboardEvent) => engine.handleKeyUp(e.key);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup",   onKeyUp);

    return () => {
      engine.destroy();
      engineRef.current = null;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup",   onKeyUp);
    };
  }, [canvasRef, onAchievement]);

  const startGame = useCallback((creature: CreatureData, levelIndex = 0, difficulty: Difficulty = "normal") => {
    setGameState("playing");
    setLevelStats(null);
    engineRef.current?.startLevel(creature, levelIndex, difficulty);
  }, []);

  const triggerSpecial = useCallback(() => {
    engineRef.current?.triggerSpecial();
  }, []);

  const triggerVoiceAction = useCallback((key: string, duration: number) => {
    engineRef.current?.handleVoiceAction(key, duration);
  }, []);

  const pressControl = useCallback((key: string) => {
    engineRef.current?.handleKeyDown(key);
  }, []);

  const releaseControl = useCallback((key: string) => {
    engineRef.current?.handleKeyUp(key);
  }, []);

  const pauseGame = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const resumeGame = useCallback(() => {
    engineRef.current?.resume();
  }, []);

  const goToMenu = useCallback(() => {
    stopEngine(engineRef.current);
    setGameState("menu");
  }, []);

  const goToCharacterSelect = useCallback(() => {
    stopEngine(engineRef.current);
    setGameState("character-select");
  }, []);

  const goToLevelSelect = useCallback(() => {
    stopEngine(engineRef.current);
    setGameState("level-select");
  }, []);

  return {
    gameState,
    hud,
    levelStats,
    startGame,
    triggerSpecial,
    triggerVoiceAction,
    pressControl,
    releaseControl,
    pauseGame,
    resumeGame,
    goToMenu,
    goToCharacterSelect,
    goToLevelSelect,
  };
}
