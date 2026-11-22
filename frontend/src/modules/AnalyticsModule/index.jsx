import { useEffect, useState } from 'react';
import { Row, Col, Statistic, Spin, Empty, DatePicker, Button, Alert } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Line, Pie, Column } from '@ant-design/plots';

import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';
import { getCurrentLangCode } from '@/locale/language';
import { useMoney } from '@/settings';

import PeriodComparison from './PeriodComparison';

/**
 * FluxCRM Analytics page (original addition).
 * Renders three charts from GET /api/invoice/analytics:
 *   - Line   : invoiced revenue per month (last 12 months)
 *   - Pie    : invoice count by status
 *   - Column : top 5 clients by revenue
 * plus a comparison with the period of the same length right before the range.
 */
export default function AnalyticsModule() {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  // Default window: the last 12 months (matches the server default).
  const [range, setRange] = useState([dayjs().subtract(11, 'month').startOf('month'), dayjs()]);
  const params = {
    from: range[0].startOf('month').format('YYYY-MM-DD'),
    to: range[1].format('YYYY-MM-DD'),
  };
  const [data, setData] = useState({
    monthlyRevenue: [],
    statusBreakdown: [],
    topClients: [],
    comparison: null,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      const res = await request.analytics({ entity: 'invoice', params });
      if (res && res.success) setData(res.result);
      else setError((res && res.message) || 'Could not load analytics');
      setLoading(false);
    };
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.from, params.to]);

  const onExport = async () => {
    setExporting(true);
    await request.analyticsExport({ entity: 'invoice', params });
    setExporting(false);
  };

  const onRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) setRange(dates);
  };

  const { monthlyRevenue, statusBreakdown, topClients, comparison } = data;

  const totalRevenue = monthlyRevenue.reduce((sum, m) => sum + (m.total || 0), 0);
  const totalInvoices = statusBreakdown.reduce((sum, s) => sum + (s.count || 0), 0);

  // Month names in the UI language (e.g. "דצמ׳ 2025" in Hebrew) from the neutral "YYYY-MM" key.
  const monthFormat = new Intl.DateTimeFormat(
    getCurrentLangCode() === 'he_il' ? 'he-IL' : 'en-US',
    {
      month: 'short',
      year: 'numeric',
    }
  );
  const revenueSeries = monthlyRevenue.map((m) => ({
    ...m,
    label: m.period ? monthFormat.format(new Date(`${m.period}-15T12:00:00`)) : m.label,
  }));

  const lineConfig = {
    data: revenueSeries,
    xField: 'label',
    yField: 'total',
    smooth: true,
    height: 300,
    point: { size: 4, shape: 'circle' },
    tooltip: {
      title: 'label',
      items: [{ field: 'total', name: translate('Total') }],
    },
    yAxis: { label: { formatter: (v) => `${v}` } },
  };

  // Translate the raw English status values (draft, pending, …) for display.
  const statusData = statusBreakdown.map((s) => ({
    status: translate(s.status),
    count: s.count,
  }));

  const pieConfig = {
    data: statusData,
    angleField: 'count',
    colorField: 'status',
    height: 320,
    radius: 0.85,
    innerRadius: 0.5,
    label: { text: 'count' },
    legend: { color: { position: 'bottom', layout: { justifyContent: 'center' } } },
  };

  const columnConfig = {
    data: topClients,
    xField: 'name',
    yField: 'total',
    height: 320,
    label: { position: 'top' },
    style: { radiusTopLeft: 6, radiusTopRight: 6 },
    axis: { x: { labelAutoRotate: true, labelAutoHide: false, title: false } },
  };

  const hasStatus = statusBreakdown.length > 0;
  const hasClients = topClients.length > 0;
  const hasRevenue = monthlyRevenue.some((m) => m.total > 0);

  const toolbar = (
    <div className="analyticsToolbar">
      <DatePicker.RangePicker
        picker="month"
        value={range}
        onChange={onRangeChange}
        allowClear={false}
        disabledDate={(d) => d && d.isAfter(dayjs().endOf('month'))}
      />
      <Button icon={<DownloadOutlined />} loading={exporting} onClick={onExport}>
        {translate('export_csv')}
      </Button>
    </div>
  );

  return (
    <>
      {toolbar}
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 24 }} />}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
              <div className="whiteBox shadow pad20">
                <Statistic
                  title={translate('total_revenue_12_months')}
                  value={moneyFormatter({ amount: totalRevenue })}
                />
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="whiteBox shadow pad20">
                <Statistic title={translate('Invoices')} value={totalInvoices} />
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="whiteBox shadow pad20">
                <PeriodComparison
                  comparison={comparison}
                  translate={translate}
                  formatMoney={(amount) => moneyFormatter({ amount })}
                />
              </div>
            </Col>
          </Row>

          <div className="space30"></div>

          <Row gutter={[32, 32]}>
            <Col xs={24}>
              <div className="whiteBox shadow pad20">
                <h3 style={{ color: '#22075e', marginBottom: 15 }}>
                  {translate('revenue_last_12_months')}
                </h3>
                <div dir="ltr">
                  {hasRevenue ? (
                    <Line {...lineConfig} />
                  ) : (
                    <Empty description={translate('No data')} />
                  )}
                </div>
              </div>
            </Col>
          </Row>

          <div className="space30"></div>

          <Row gutter={[32, 32]}>
            <Col xs={24} lg={12}>
              <div className="whiteBox shadow pad20" style={{ minHeight: 380 }}>
                <h3 style={{ color: '#22075e', marginBottom: 15 }}>
                  {translate('invoices_by_status')}
                </h3>
                <div dir="ltr">
                  {hasStatus ? (
                    <Pie {...pieConfig} />
                  ) : (
                    <Empty description={translate('No data')} />
                  )}
                </div>
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <div className="whiteBox shadow pad20" style={{ minHeight: 380 }}>
                <h3 style={{ color: '#22075e', marginBottom: 15 }}>{translate('top_5_clients')}</h3>
                <div dir="ltr">
                  {hasClients ? (
                    <Column {...columnConfig} />
                  ) : (
                    <Empty description={translate('No data')} />
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </>
      )}
    </>
  );
}
