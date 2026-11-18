import { Dropdown, Button } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

import { request } from '@/request';
import { LANGUAGES, getCurrentLangCode, getCurrentLang, setLanguage } from '@/locale/language';

// FluxCRM language switcher (Hebrew / English) shown in the top header.
export default function LanguageSwitcher() {
  const currentCode = getCurrentLangCode();
  const currentLang = getCurrentLang();

  const items = LANGUAGES.map((l) => ({
    key: l.code,
    label: (
      <span>
        {l.flag} {l.label}
      </span>
    ),
  }));

  const onClick = async ({ key }) => {
    if (key === currentCode) return;
    // Persist the preference on the server (best effort), then apply it locally.
    await request.updateLanguage({ language: key });
    setLanguage(key);
  };

  return (
    <Dropdown
      menu={{ items, selectable: true, selectedKeys: [currentCode], onClick }}
      trigger={['click']}
      placement="bottomRight"
    >
      <Button type="text" icon={<GlobalOutlined />} style={{ cursor: 'pointer' }}>
        {currentLang.flag} {currentLang.label}
      </Button>
    </Dropdown>
  );
}
