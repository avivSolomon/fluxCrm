import { Result } from 'antd';

const About = () => {
  return (
    <Result
      status="info"
      title={'FluxCRM'}
      subTitle={'Client & Invoice Management'}
      extra={
        <p style={{ maxWidth: 520, margin: '0 auto' }}>
          FluxCRM is a client and invoice management system that helps you manage
          customers, invoices, quotes and payments in one place.
        </p>
      }
    />
  );
};

export default About;
