import { Statistic, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

/**
 * FluxCRM – period comparison card (original addition).
 * Shows the revenue of the selected range next to the range of the same length
 * right before it, with the change in percent from the server (comparison.changePercent).
 *
 * Props:
 *   comparison – { current: {total,count}, previous: {total,count}, changePercent, previousFrom, previousTo }
 *   translate  – the useLanguage() function
 *   formatMoney – (amount) => string
 */
export default function PeriodComparison({ comparison, translate, formatMoney }) {
  if (!comparison) return null;
  const { previous, changePercent } = comparison;

  let change;
  if (changePercent === null || changePercent === undefined) {
    change = <Tag data-testid="change">{translate('no_previous_data')}</Tag>;
  } else {
    const up = changePercent >= 0;
    change = (
      <>
        <Tag
          data-testid="change"
          color={up ? 'green' : 'red'}
          icon={up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        >
          <bdi dir="ltr">{`${up ? '+' : ''}${changePercent}%`}</bdi>
        </Tag>
        <span>{translate('vs_previous_period')}</span>
      </>
    );
  }

  return (
    <div>
      <Statistic
        title={translate('previous_period')}
        value={formatMoney(previous.total)}
        suffix={<span style={{ fontSize: 14 }}>({previous.count})</span>}
      />
      <div style={{ marginTop: 8 }}>{change}</div>
    </div>
  );
}
