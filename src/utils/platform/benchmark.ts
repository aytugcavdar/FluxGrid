/**
 * Micro-Benchmark System
 * Tests GPU, CPU, and Memory performance during splash screen
 */

export interface BenchmarkResult {
  gpuScore: number;      // 0-100
  cpuScore: number;      // 0-100
  memoryScore: number;   // 0-100
  compositeScore: number; // 0-100
  duration: number;      // ms
  timestamp: number;
}

/**
 * Run micro-benchmark tests during splash screen
 * Tests GPU, CPU, and Memory performance
 * Duration: ~500ms
 */
export async function runMicroBenchmark(): Promise<BenchmarkResult> {
  const startTime = performance.now();
  
  console.log('[Benchmark] 🔬 Starting micro-benchmark tests...');
  
  // Test 1: GPU Render Performance (200ms)
  const gpuScore = await testGPUPerformance();
  
  // Test 2: CPU Computation (150ms)
  const cpuScore = await testCPUPerformance();
  
  // Test 3: Memory Speed (150ms)
  const memoryScore = await testMemoryPerformance();
  
  // Calculate composite score (0-100)
  const compositeScore = Math.round(
    (gpuScore * 0.5) +      // GPU: 50%
    (cpuScore * 0.3) +      // CPU: 30%
    (memoryScore * 0.2)     // Memory: 20%
  );
  
  const duration = performance.now() - startTime;
  
  const result: BenchmarkResult = {
    gpuScore,
    cpuScore,
    memoryScore,
    compositeScore,
    duration,
    timestamp: Date.now()
  };
  
  console.log('[Benchmark] ✅ Benchmark complete:', result);
  
  // Save to localStorage for Settings display
  try {
    localStorage.setItem('device_benchmark', JSON.stringify(result));
  } catch (error) {
    console.warn('[Benchmark] Failed to save benchmark result:', error);
  }
  
  return result;
}

/**
 * Test GPU rendering performance
 * Creates a WebGL scene with triangles and measures FPS
 * More realistic test with actual geometry rendering
 */
async function testGPUPerformance(): Promise<number> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.warn('[Benchmark] WebGL not available');
      return 30; // Fallback score
    }
    
    // Cast to WebGLRenderingContext for type safety
    const webgl = gl as WebGLRenderingContext;
    
    // Create shader program
    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;
    
    const fragmentShaderSource = `
      precision mediump float;
      uniform vec4 color;
      void main() {
        gl_FragColor = color;
      }
    `;
    
    const vertexShader = webgl.createShader(webgl.VERTEX_SHADER)!;
    webgl.shaderSource(vertexShader, vertexShaderSource);
    webgl.compileShader(vertexShader);
    
    const fragmentShader = webgl.createShader(webgl.FRAGMENT_SHADER)!;
    webgl.shaderSource(fragmentShader, fragmentShaderSource);
    webgl.compileShader(fragmentShader);
    
    const program = webgl.createProgram()!;
    webgl.attachShader(program, vertexShader);
    webgl.attachShader(program, fragmentShader);
    webgl.linkProgram(program);
    webgl.useProgram(program);
    
    // Create triangle buffer
    const vertices = new Float32Array([
      -0.5, -0.5,
       0.5, -0.5,
       0.0,  0.5
    ]);
    
    const buffer = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, buffer);
    webgl.bufferData(webgl.ARRAY_BUFFER, vertices, webgl.STATIC_DRAW);
    
    const positionLocation = webgl.getAttribLocation(program, 'position');
    webgl.enableVertexAttribArray(positionLocation);
    webgl.vertexAttribPointer(positionLocation, 2, webgl.FLOAT, false, 0, 0);
    
    const colorLocation = webgl.getUniformLocation(program, 'color');
    
    // Render test - draw 500 triangles per frame
    const startTime = performance.now();
    let frames = 0;
    const targetFrames = 120;
    const trianglesPerFrame = 500;
    
    while (frames < targetFrames && (performance.now() - startTime) < 500) {
      webgl.clear(webgl.COLOR_BUFFER_BIT);
      
      // Draw multiple triangles
      for (let i = 0; i < trianglesPerFrame; i++) {
        webgl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1.0);
        webgl.drawArrays(webgl.TRIANGLES, 0, 3);
      }
      
      frames++;
    }
    
    const elapsed = performance.now() - startTime;
    const fps = (frames / elapsed) * 1000;
    
    // Cleanup
    document.body.removeChild(canvas);
    
    // Score: 0-100 based on FPS
    // 240 FPS = 100 points (very high target for stress test)
    // 120 FPS = 50 points
    // 60 FPS = 25 points
    const score = Math.min(100, Math.round((fps / 240) * 100));
    
    console.log('[Benchmark] GPU Test:', { fps: fps.toFixed(1), score, trianglesRendered: frames * trianglesPerFrame });
    
    return score;
  } catch (error) {
    console.error('[Benchmark] GPU test failed:', error);
    return 30; // Fallback
  }
}

/**
 * Test CPU computation performance
 * Matrix multiplication and math operations (more intensive)
 */
async function testCPUPerformance(): Promise<number> {
  try {
    const startTime = performance.now();
    
    // Larger matrix multiplication test (100x100 instead of 50x50)
    const size = 100;
    const matrixA = Array(size).fill(0).map(() => 
      Array(size).fill(0).map(() => Math.random())
    );
    const matrixB = Array(size).fill(0).map(() => 
      Array(size).fill(0).map(() => Math.random())
    );
    
    // Multiply matrices
    const result = Array(size).fill(0).map(() => Array(size).fill(0));
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        for (let k = 0; k < size; k++) {
          result[i][j] += matrixA[i][k] * matrixB[k][j];
        }
      }
    }
    
    // Additional math operations
    let sum = 0;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        sum += Math.sqrt(result[i][j]) * Math.sin(result[i][j]);
      }
    }
    
    const elapsed = performance.now() - startTime;
    
    // Score: 0-100 based on time
    // 100ms = 100 points (flagship)
    // 300ms = 50 points (mid-range)
    // 500ms = 20 points (low-end)
    const score = Math.min(100, Math.max(0, Math.round(150 - (elapsed / 4))));
    
    console.log('[Benchmark] CPU Test:', { time: elapsed.toFixed(1) + 'ms', score, operations: size * size * size });
    
    return score;
  } catch (error) {
    console.error('[Benchmark] CPU test failed:', error);
    return 30; // Fallback
  }
}

/**
 * Test memory performance
 * Large array operations with multiple passes
 */
async function testMemoryPerformance(): Promise<number> {
  try {
    const startTime = performance.now();
    
    // Create larger array (5M elements instead of 1M)
    const size = 5000000;
    const arr = new Float32Array(size);
    
    // Fill with random values
    for (let i = 0; i < size; i++) {
      arr[i] = Math.random() * 100;
    }
    
    // Multiple operations
    // 1. Find min/max
    let min = arr[0];
    let max = arr[0];
    for (let i = 1; i < size; i++) {
      if (arr[i] < min) min = arr[i];
      if (arr[i] > max) max = arr[i];
    }
    
    // 2. Calculate sum and average
    let sum = 0;
    for (let i = 0; i < size; i++) {
      sum += arr[i];
    }
    const avg = sum / size;
    
    // 3. Count elements above average
    let count = 0;
    for (let i = 0; i < size; i++) {
      if (arr[i] > avg) count++;
    }
    
    // 4. Partial sort (first 10000 elements)
    const sortSize = 10000;
    const sortArr = arr.slice(0, sortSize);
    sortArr.sort();
    
    const elapsed = performance.now() - startTime;
    
    // Score: 0-100 based on time
    // 200ms = 100 points (flagship)
    // 500ms = 50 points (mid-range)
    // 1000ms = 10 points (low-end)
    const score = Math.min(100, Math.max(0, Math.round(125 - (elapsed / 8))));
    
    console.log('[Benchmark] Memory Test:', { time: elapsed.toFixed(1) + 'ms', score, arraySize: size });
    
    return score;
  } catch (error) {
    console.error('[Benchmark] Memory test failed:', error);
    return 30; // Fallback
  }
}

/**
 * Get saved benchmark result from localStorage
 */
export function getSavedBenchmark(): BenchmarkResult | null {
  try {
    const saved = localStorage.getItem('device_benchmark');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('[Benchmark] Failed to load saved benchmark:', error);
  }
  return null;
}
