export const getDragYOffset = (): number => {
  const isMobile = window.innerWidth < 768;
  if (!isMobile) return 0;
  
  // Calculate based on screen height for better alignment
  const screenHeight = window.innerHeight;
  if (screenHeight < 700) return -70;  // Short screens
  if (screenHeight < 800) return -90;  // Medium screens
  return Math.min(-90, -screenHeight * 0.11); // Tall screens
};
