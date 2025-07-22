import countries from 'i18n-iso-countries';

countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

const countryCodes = Object.keys(countries.getAlpha2Codes());

export const countriesList = countryCodes
  .filter((code) => code !== 'IL')
  .map((code) => ({
    code: code.toLowerCase(),
    name: countries.getName(code, 'en'),
    flag: `https://flagcdn.com/w40/${code.toLowerCase()}.png`,
  }));
