import { useEffect } from 'react';
import { ConfigProvider } from 'antd';

import antdLocale from './antdLocale';
import { getCurrentLang } from './language';

export default function Localization({ children }) {
  const lang = getCurrentLang();

  // Apply document direction/lang so RTL (Hebrew) flows correctly.
  useEffect(() => {
    document.documentElement.dir = lang.dir;
    document.documentElement.lang = lang.code;
  }, [lang.dir, lang.code]);

  return (
    <ConfigProvider
      direction={lang.dir}
      locale={antdLocale[lang.code]}
      theme={{
        token: {
          colorPrimary: '#339393',
          colorLink: '#1640D6',
          borderRadius: 0,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
