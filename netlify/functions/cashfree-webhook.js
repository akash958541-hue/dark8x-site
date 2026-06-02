exports.handler = async (event) => {
  console.log("Cashfree Webhook:", event.body);

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true
    })
  };
};
