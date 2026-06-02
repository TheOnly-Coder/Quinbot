const fetch = global.fetch;
const config = require('./config');

async function askLLM(message) {
  try {
    const res = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        stream: false,
        messages: [
          {
            role: 'system',
            content: config.systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    const data = await res.json();

    return data?.message?.content || '';
  } catch (err) {
    console.error('LLM error:', err);
    return '';
  }
}

module.exports = {
  askLLM
};
