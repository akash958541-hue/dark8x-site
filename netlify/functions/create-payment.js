const https = require('https');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ALLOWED_ORIGIN = 'https://dark8x.netlify.app';

  const headers = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body = JSON.parse(event.body);
    const { customerName, customerEmail, customerPhone, productName, amount, returnUrl } = body;

    if (!customerName || !customerEmail || !customerPhone || !amount) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const linkId = 'DARK8X_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5).toUpperCase();

    const payload = JSON.stringify({
      link_id: linkId,
      link_amount: amount,
      link_currency: 'INR',
      link_purpose: productName || 'App Project',
      customer_details: {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: '91' + customerPhone.replace(/\D/g, '').slice(-10)
      },
      link_notify: { send_sms: true, send_email: true },
      link_meta: {
        return_url: returnUrl || 'https://dark8x.netlify.app?status=SUCCESS'
      },
      link_expiry_time: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.cashfree.com',
        path: '/pg/links',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': '2023-08-01',
          'x-client-id': '12837852c1c2630b2933afd47575873821',
          'x-client-secret': 'cfsk_ma_prod_40c1f31d15cc89b9d530c818eed8a0e4_1883640b'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
          catch(e) { reject(e); }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    if (result.status === 200 && result.data.link_url) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ link_url: result.data.link_url, link_id: linkId })
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Cashfree error', details: result.data })
      };
    }

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
  
