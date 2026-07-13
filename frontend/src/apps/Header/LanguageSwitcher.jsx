import { Dropdown, Button } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

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

  const onClick = ({ key }) => {
    if (key !== currentCode) setLanguage(key);
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
