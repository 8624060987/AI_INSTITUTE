/**
 * Daily 5-Login Limit Per Device & Gmail Account Security Policy
 * Enforces a strict maximum of 5 successful logins per day per device AND per Gmail account.
 * Even if credentials (Gmail & Password) are 100% correct, the 6th login of the day is BLOCKED!
 */

const DAILY_LOGIN_LIMIT = 5;
const DEVICE_TRACKER_KEY = 'lms_device_daily_login_attempts';

export interface LoginAttemptRecord {
  timestamp: string;
  date: string;
  identifier?: string;
}

export interface SecurityCheckResult {
  allowed: boolean;
  count: number;
  remaining: number;
  limit: number;
  message?: string;
}

/**
 * Gets valid login attempts recorded for this device / Gmail account today (within 24 hours).
 */
export function getDailyDeviceLoginRecords(identifier?: string): LoginAttemptRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const rawDevice = localStorage.getItem(DEVICE_TRACKER_KEY);
    const deviceList: LoginAttemptRecord[] = rawDevice ? JSON.parse(rawDevice) : [];
    
    let emailList: LoginAttemptRecord[] = [];
    if (identifier && identifier.includes('@')) {
      const cleanEmail = identifier.toLowerCase().trim().replace(/[^a-z0-9@]/g, '_');
      const rawEmail = localStorage.getItem(`lms_login_history_${cleanEmail}`);
      if (rawEmail) emailList = JSON.parse(rawEmail);
    }

    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    const filterValid = (list: LoginAttemptRecord[]) => list.filter(item => {
      const itemTime = new Date(item.timestamp).getTime();
      return item.date === today || itemTime > twentyFourHoursAgo;
    });

    const validDevice = filterValid(deviceList);
    const validEmail = filterValid(emailList);

    // Save cleaned lists
    if (validDevice.length !== deviceList.length) {
      localStorage.setItem(DEVICE_TRACKER_KEY, JSON.stringify(validDevice));
    }

    // Whichever count is higher (device or email history)
    return validEmail.length > validDevice.length ? validEmail : validDevice;
  } catch (e) {
    return [];
  }
}

/**
 * Checks whether the current device or Gmail account is allowed to log in (under 5 logins per 24 hours).
 */
export function checkDailyDeviceLoginAllowed(identifier?: string): SecurityCheckResult {
  const records = getDailyDeviceLoginRecords(identifier);
  const count = records.length;
  const remaining = Math.max(0, DAILY_LOGIN_LIMIT - count);
  const allowed = count < DAILY_LOGIN_LIMIT;

  return {
    allowed,
    count,
    remaining,
    limit: DAILY_LOGIN_LIMIT,
    message: !allowed 
      ? `🛡️ SECURITY BLOCK: Daily 5-login limit reached! Even with correct Gmail & Password, maximum 5 logins per day are allowed (${count}/${DAILY_LOGIN_LIMIT} used today). Access is locked until tomorrow.`
      : undefined
  };
}

/**
 * Records a new successful login attempt for this device AND Gmail account.
 */
export function recordDailyDeviceLogin(identifier?: string): {
  allowed: boolean;
  count: number;
  remaining: number;
} {
  const records = getDailyDeviceLoginRecords(identifier);
  const newRecord: LoginAttemptRecord = {
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    identifier: identifier || 'user'
  };

  const updated = [...records, newRecord];
  try {
    localStorage.setItem(DEVICE_TRACKER_KEY, JSON.stringify(updated));
    if (identifier && identifier.includes('@')) {
      const cleanEmail = identifier.toLowerCase().trim().replace(/[^a-z0-9@]/g, '_');
      localStorage.setItem(`lms_login_history_${cleanEmail}`, JSON.stringify(updated));
    }
  } catch (e) {}

  const newCount = updated.length;
  const newRemaining = Math.max(0, DAILY_LOGIN_LIMIT - newCount);

  return {
    allowed: newCount <= DAILY_LOGIN_LIMIT,
    count: newCount,
    remaining: newRemaining
  };
}
