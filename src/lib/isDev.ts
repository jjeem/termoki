export const isDevEnvironment = () => {
  // should work fine since we use vite and not electron
  return (
    process.env.NODE_ENV === "development" || !!process.env.VITE_DEV_SERVER_URL
  );
};
