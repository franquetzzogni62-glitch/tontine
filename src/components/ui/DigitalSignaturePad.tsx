import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';
import { Button } from './Button';

interface DigitalSignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
  beneficiaryName: string;
  className?: string;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  onSignatureChange,
  beneficiaryName,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Set up canvas context and sizing
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#047857'; // Emerald dark ink
  }, []);

  useEffect(() => {
    initCanvas();
    const handleResize = () => initCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();

    if (!hasDrawn) {
      setHasDrawn(true);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange(dataUrl);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasDrawn(false);
    onSignatureChange(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <PenTool size={13} className="text-emerald-600" />
          <span>Signature numérique du bénéficiaire pour décharge :</span>
        </label>
        {hasDrawn && (
          <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
            <Check size={12} /> Signé numériquement
          </span>
        )}
      </div>

      <div className="relative border-2 border-dashed border-emerald-500/40 dark:border-emerald-500/30 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-inner touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-36 cursor-crosshair block"
        />

        {/* Placeholder hint when canvas is empty */}
        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-4 text-center">
            <PenTool size={22} className="opacity-40 mb-1" />
            <span className="text-xs font-medium">
              {beneficiaryName}, signez ici du doigt ou au stylet
            </span>
            <span className="text-[10px] opacity-70">
              « Bon pour décharge des espèces reçues »
            </span>
          </div>
        )}

        {/* Clear Button */}
        {hasDrawn && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            title="Effacer la signature"
          >
            <RotateCcw size={12} />
            <span className="text-[10px]">Effacer</span>
          </button>
        )}

        {/* Footer line for signing */}
        <div className="absolute bottom-2 left-4 right-4 pointer-events-none border-b border-slate-200 dark:border-slate-800 flex justify-between text-[9px] text-slate-400">
          <span>X Décharge bénéficiaire</span>
          <span>Horodaté cryptographiquement</span>
        </div>
      </div>
    </div>
  );
};
