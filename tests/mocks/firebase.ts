import { vi } from 'vitest';

// Mock Firestore
export const mockGetDoc = vi.fn();
export const mockSetDoc = vi.fn();
export const mockUpdateDoc = vi.fn();
export const mockDeleteDoc = vi.fn();
export const mockGetDocs = vi.fn();
export const mockAddDoc = vi.fn();
export const mockQuery = vi.fn();
export const mockWhere = vi.fn();
export const mockOrderBy = vi.fn();
export const mockLimit = vi.fn();
export const mockGetCountFromServer = vi.fn();

export const mockDoc = vi.fn(() => ({
  id: 'mock-doc-id',
  path: 'mock/path',
}));

export const mockCollection = vi.fn(() => ({
  id: 'mock-collection-id',
  path: 'mock-collection/path',
}));

// Mock Auth
export const mockSignInWithPopup = vi.fn();
export const mockSignOut = vi.fn();
export const mockOnAuthStateChanged = vi.fn((callback) => {
  // Return unsubscribe function
  return vi.fn();
});

export const mockAuth = {
  currentUser: null,
  signInWithPopup: mockSignInWithPopup,
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
};

// Mock Firestore instance
export const mockFirestore = {
  collection: mockCollection,
  doc: mockDoc,
};

// Reset all mocks
export const resetFirebaseMocks = () => {
  mockGetDoc.mockReset();
  mockSetDoc.mockReset();
  mockUpdateDoc.mockReset();
  mockDeleteDoc.mockReset();
  mockGetDocs.mockReset();
  mockAddDoc.mockReset();
  mockQuery.mockReset();
  mockWhere.mockReset();
  mockOrderBy.mockReset();
  mockLimit.mockReset();
  mockGetCountFromServer.mockReset();
  mockDoc.mockReset();
  mockCollection.mockReset();
  mockSignInWithPopup.mockReset();
  mockSignOut.mockReset();
  mockOnAuthStateChanged.mockReset();
};
