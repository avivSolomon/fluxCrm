const useAppSettings = () => {
  let settings = {};
  settings['idurar_app_email'] = 'noreply@fluxcrm.app';
  settings['idurar_base_url'] = 'https://app.fluxcrm.app';
  return settings;
};

module.exports = useAppSettings;
