import { v4 as uuidv4 } from 'uuid';

export class DeviceService {
  private static DEVICE_ID_KEY = 'todo_device_id';
  
  static getDeviceId(): string {
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `device_${uuidv4()}`;
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }
  
  static clearDeviceId(): void {
    localStorage.removeItem(this.DEVICE_ID_KEY);
  }
  
  static hasDeviceId(): boolean {
    return !!localStorage.getItem(this.DEVICE_ID_KEY);
  }
}