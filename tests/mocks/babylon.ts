import { vi } from 'vitest';

// Mock Engine
export const mockEngine = {
  dispose: vi.fn(),
  resize: vi.fn(),
  runRenderLoop: vi.fn(),
  stopRenderLoop: vi.fn(),
};

// Mock Scene
export const mockScene = {
  render: vi.fn(),
  dispose: vi.fn(),
  clearColor: { r: 0, g: 0, b: 0, a: 1 },
};

// Mock Camera
export const mockCamera = {
  position: { x: 0, y: 0, z: 0 },
  setTarget: vi.fn(),
  attachControl: vi.fn(),
  detachControl: vi.fn(),
};

// Mock Light
export const mockLight = {
  intensity: 1,
  position: { x: 0, y: 0, z: 0 },
  dispose: vi.fn(),
};

// Mock Mesh
export const mockMesh = {
  position: { x: 0, y: 0, z: 0 },
  scaling: { x: 1, y: 1, z: 1 },
  rotation: { x: 0, y: 0, z: 0 },
  material: null,
  dispose: vi.fn(),
  setEnabled: vi.fn(),
};

// Mock Material
export const mockMaterial = {
  diffuseColor: { r: 1, g: 1, b: 1 },
  emissiveColor: { r: 0, g: 0, b: 0 },
  alpha: 1,
  dispose: vi.fn(),
};

// Reset all mocks
export const resetBabylonMocks = () => {
  mockEngine.dispose.mockReset();
  mockEngine.resize.mockReset();
  mockEngine.runRenderLoop.mockReset();
  mockEngine.stopRenderLoop.mockReset();
  mockScene.render.mockReset();
  mockScene.dispose.mockReset();
  mockCamera.setTarget.mockReset();
  mockCamera.attachControl.mockReset();
  mockCamera.detachControl.mockReset();
  mockLight.dispose.mockReset();
  mockMesh.dispose.mockReset();
  mockMesh.setEnabled.mockReset();
  mockMaterial.dispose.mockReset();
};
