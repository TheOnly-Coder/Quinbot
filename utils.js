function clean(text) {
  return text?.toString().replace(/§./g, '').trim() || '';
}

module.exports = {
  clean
};
