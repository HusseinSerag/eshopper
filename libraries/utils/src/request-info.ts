import { UAParser } from 'ua-parser-js';

export function getDeviceInfo(userAgent: string | undefined) {
  const result = UAParser(userAgent);

  return {
    browser: result.browser.name || '',
    os: result.os.name || '',
    device: result.device.model || '',
    type: result.device.type || '',
    vendor: result.device.vendor || '',
    engine: result.engine.name || '',
    version: result.engine.version || '',
    architecture: result.cpu.architecture || '',
    cpu: result.cpu.architecture || '',
    deviceType: result.device.type || '',
    deviceVendor: result.device.vendor || '',
    deviceModel: result.device.model || '',
    deviceVersion: result.device.model || '',
    browserVersion: result.browser.version || '',
    browserMajor: result.browser.major || '',
    browserType: result.browser.type || '',
    browserName: result.browser.name || '',
  };
}
