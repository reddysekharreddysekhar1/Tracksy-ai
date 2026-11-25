export interface StoredUserAccount {
  name: string;
  email: string;
  password: string;
  handle: string;
  createdAt: string;
  role?: 'user' | 'admin';
}

const STORAGE_KEY = 'tracksy_user_accounts';

// Seed initial default accounts if none exist
export const getStoredUserAccounts = (): StoredUserAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading stored user accounts', e);
  }

  // Default seeded demo accounts
  const defaultAccounts: StoredUserAccount[] = [
    {
      name: 'Sekhar Reddy',
      email: 'user@gmail.com',
      password: 'user123',
      handle: '@sekhar_r',
      createdAt: '2026-01-15',
      role: 'user',
    },
    {
      name: 'Alex Johnson',
      email: 'demo@tracksy.ai',
      password: 'password123',
      handle: '@alex_j',
      createdAt: '2026-02-10',
      role: 'user',
    },
    {
      name: 'System Admin',
      email: 'admi@gmail.com',
      password: 'admin',
      handle: '@admin_master',
      createdAt: '2026-01-01',
      role: 'admin',
    },
  ];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAccounts));
  } catch (e) {
    // Ignore storage quota
  }

  return defaultAccounts;
};

export const registerUserAccount = (account: Omit<StoredUserAccount, 'createdAt'>): { success: boolean; error?: string } => {
  const accounts = getStoredUserAccounts();
  const cleanEmail = account.email.trim().toLowerCase();

  // Check if email already registered
  const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
  if (existing) {
    return { success: false, error: 'An account with this email address already exists. Please log in.' };
  }

  const newAccount: StoredUserAccount = {
    ...account,
    email: cleanEmail,
    createdAt: new Date().toISOString(),
  };

  accounts.push(newAccount);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  return { success: true };
};

export const authenticateUserAccount = (
  emailInput: string,
  passwordInput: string
): { success: boolean; user?: StoredUserAccount; error?: string } => {
  const accounts = getStoredUserAccounts();
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: 'Please enter both your email and password.' };
  }

  // Check admin
  if ((cleanEmail === 'admi@gmail.com' || cleanEmail === 'admin') && cleanPassword === 'admin') {
    return {
      success: true,
      user: {
        name: 'System Admin',
        email: 'admi@gmail.com',
        password: 'admin',
        handle: '@admin_master',
        createdAt: '2026-01-01',
        role: 'admin',
      },
    };
  }

  const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
  if (!found) {
    return {
      success: false,
      error: `No account found for "${cleanEmail}". Check your email address or click "Create Account" below.`,
    };
  }

  if (found.password !== cleanPassword) {
    return {
      success: false,
      error: 'Incorrect password entered for this account. Please try again or use "Forgot Password".',
    };
  }

  return { success: true, user: found };
};

export const updateUserPassword = (emailInput: string, newPassword: string): { success: boolean; error?: string } => {
  const accounts = getStoredUserAccounts();
  const cleanEmail = emailInput.trim().toLowerCase();

  const index = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);
  if (index === -1) {
    // If not found, create an account for them so they can immediately log in
    accounts.push({
      name: cleanEmail.split('@')[0] || 'User',
      email: cleanEmail,
      password: newPassword,
      handle: `@${cleanEmail.split('@')[0]}`,
      createdAt: new Date().toISOString(),
      role: 'user',
    });
  } else {
    accounts[index].password = newPassword;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  return { success: true };
};
