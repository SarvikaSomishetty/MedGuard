declare module 'quagga' {
  interface QuaggaConfig {
    inputStream: {
      name: string;
      type: string;
      target: HTMLElement | null;
      constraints?: {
        facingMode?: string;
        width?: number;
        height?: number;
        aspectRatio?: number;
      };
    };
    decoder: {
      readers: string[];
      multiple?: boolean;
      debug?: {
        drawBoundingBox?: boolean;
        showPattern?: boolean;
      };
    };
    locator?: {
      patchSize?: 'small' | 'medium' | 'large';
      halfSample?: boolean;
    };
    numOfWorkers?: number;
    locate?: boolean;
  }

  interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  interface Line {
    x: number[];
    y: number[];
  }

  interface CodeResult {
    code: string;
    format: string;
    confidence: number;
  }

  interface ProcessedResult {
    boxes?: Box[];
    box?: Box;
    line?: Line;
    codeResult?: CodeResult;
  }

  interface DetectedResult {
    codeResult: CodeResult;
    line: Line;
    box: Box;
    boxes: Box[];
  }

  interface Canvas {
    ctx: {
      overlay: CanvasRenderingContext2D;
    };
    dom: {
      overlay: HTMLCanvasElement;
    };
  }

  interface ImageDebug {
    drawPath: (path: Box | Line, start: { x: number | string, y: number | string }, ctx: CanvasRenderingContext2D, style: { color: string, lineWidth: number }) => void;
  }

  interface QuaggaStatic {
    init(config: QuaggaConfig, callback: (err: Error | null) => void): void;
    start(): void;
    stop(): void;
    onDetected(callback: (result: DetectedResult) => void): void;
    onProcessed(callback: (result: ProcessedResult | null) => void): void;
    canvas: Canvas;
    ImageDebug: ImageDebug;
    decodeSingle(config: QuaggaConfig, callback: (result: DetectedResult) => void): void;
  }

  const Quagga: QuaggaStatic;
  export default Quagga;
} 