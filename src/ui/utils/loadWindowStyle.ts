const loadWindowStyle = async () => {
  const config = await window.api.getSettingsByKey("window.style");

  Object.entries(config).forEach((prop) => {
    document.documentElement.style.setProperty(prop[0], prop[1]);
  });
};

export default loadWindowStyle;
