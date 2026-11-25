import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

export const getGoogleAuthUrlHandler = (req: Request, res: Response) => {
  const { clientId } = config.oauth;
  if (!clientId) {
    return res.status(500).json({
      success: false,
      error: 'OAUTH_CLIENT_ID is not configured in backend environment.',
    });
  }

  const host = req.get('x-forwarded-host') || req.get('host');
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
  const scope = 'openid email profile';

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=select_account`;

  return res.json({ success: true, url: authUrl });
};

export const googleAuthCallbackHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return res.status(400).send('Authorization code missing.');
    }

    const { clientId, clientSecret } = config.oauth;
    const host = req.get('x-forwarded-host') || req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData: any = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(400).send('OAuth Token Exchange Failed');
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData: any = await userRes.json();

    const name = userData.name || 'Google User';
    const email = userData.email || 'user@example.com';
    const avatarUrl = userData.picture || '';
    const handle = `@${email.split('@')[0]}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tracksy Authentication</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; }
            .card { background: white; padding: 2rem; border-radius: 1.5rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); text-align: center; max-width: 320px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h3>Connected as ${name}</h3>
            <p>Syncing authentication profile to Tracksy...</p>
          </div>
          <script>
            const userProfile = {
              name: ${JSON.stringify(name)},
              email: ${JSON.stringify(email)},
              avatarUrl: ${JSON.stringify(avatarUrl)},
              handle: ${JSON.stringify(handle)}
            };
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', userProfile }, '*');
              setTimeout(() => { window.close(); }, 600);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `;
    return res.send(html);
  } catch (error: any) {
    next(error);
  }
};
