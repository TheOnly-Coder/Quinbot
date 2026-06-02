module.exports = {
  host: 'mordial.mc-server.net',
  port: 25565,
  username: 'Quin',
  
  apiUrl: 'http://127.0.0.1:11435/api/chat',
  model: 'qwen2.5:7b',

  cooldownMs: 0,
admins: [
  'Quinbiz',
  'Jibluz'
],
  systemPrompt: `
You are Quin, a Minecraft assistant.
Be short, natural, and helpful.
Only respond when directly addressed.
`
};

