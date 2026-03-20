/** Check if tutorial has been seen */
export const shouldShowTutorial = (): boolean => {
  try {
    return localStorage.getItem('flux_onboard_v1') !== 'true';
  } catch {
    return true;
  }
};
