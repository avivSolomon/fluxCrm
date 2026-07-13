import { useEffect, useState } from 'react';
import { Row, Col, Statistic, Spin, Empty } from 'antd';
import { Line, Pie, Column } from '@ant-design/plots';

import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';

/**
 * FluxCRM Analytics page (original addition).
 * Renders three charts from GET /api/invoice/analytics:
 *   - Line   : invoiced revenue per month (last 12 months)
 *   - Pie    : invoice count by status
 *   - Column : top 5 clients by revenue
 */
export default function AnalyticsModule() {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    monthlyRevenue: [],
    statusBreakdown: [],
    topClients: [],
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const res = await request.analytics({ entity: 'invoice' });
      if (res && res.success) setData(res.result);
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  const { monthlyRevenue, statusBreakdown, topClients } = data;

  const totalRevenue = monthlyRevenue.reduce((sum, m) => sum + (m.total || 0), 0);
  const totalInvoices = statusBreakdown.reduce((sum, s) => sum + (s.count || 0), 0);

  const lineConfig = {
    data: monthlyRevenue,
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <Row gutter={[32, 32]}>
        <Col xs={24} md={12}>
          <div className="whiteBox shadow pad20">
            <Statistic
              title={translate('total_revenue_12_months')}
              value={moneyFormatter({ amount: totalRevenue })}
            />
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div className="whiteBox shadow pad20">
            <Statistic title={translate('Invoices')} value={totalInvoices} />
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
              {hasRevenue ? <Line {...lineConfig} /> : <Empty description={translate('No data')} />}
            </div>
          </div>
        </Col>
      </Row>

      <div className="space30"></div>

      <Row gutter={[32, 32]}>
        <Col xs={24} lg={12}>
          <div className="whiteBox shadow pad20" style={{ minHeight: 380 }}>
            <h3 style={{ color: '#22075e', marginBottom: 15 }}>{translate('invoices_by_status')}</h3>
            <div dir="ltr">
              {hasStatus ? <Pie {...pieConfig} /> : <Empty description={translate('No data')} />}
            </div>
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div className="whiteBox shadow pad20" style={{ minHeight: 380 }}>
            <h3 style={{ color: '#22075e', marginBottom: 15 }}>{translate('top_5_clients')}</h3>
            <div dir="ltr">
              {hasClients ? <Column {...columnConfig} /> : <Empty description={translate('No data')} />}
            </div>
          </div>
        </Col>
      </Row>
    </>
  );
}
