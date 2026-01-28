import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { Strategy as SamlStrategy } from 'passport-saml';
import User from '../models/User.js';
import { logUserAction, logSecurityEvent } from '../middleware/audit.js';

const router = express.Router();

// Configure Google OAuth2 Strategy (only if credentials are available)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.REACT_APP_API_URL}/api/sso/google/callback`,
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    // Find or create user
    let user = await User.findOne({
      $or: [
        { email: profile.emails[0].value },
        { ssoProvider: 'google', ssoId: profile.id }
      ]
    });

    if (!user) {
      // Create new user
      user = new User({
        name: profile.displayName,
        email: profile.emails[0].value,
        avatar: profile.photos[0]?.value,
        ssoProvider: 'google',
        ssoId: profile.id,
        isSSOUser: true,
        isEmailVerified: true,
        password: Math.random().toString(36).slice(-8), // Random password
        roles: ['user'] // Default role
      });

      await user.save();
      
      // Log new SSO user creation
      await logSecurityEvent('sso_user_created', user, {
        metadata: {
          provider: 'google',
          profileId: profile.id
        }
      });
    } else {
      // Update existing user's SSO info if not set
      if (!user.ssoProvider || !user.ssoId) {
        user.ssoProvider = 'google';
        user.ssoId = profile.id;
        user.isSSOUser = true;
        await user.save();
      }

      // Log SSO login
      await logUserAction(user, 'login', 'sso', {
        metadata: {
          provider: 'google',
          profileId: profile.id
        }
      });
    }

    return done(null, user);
  } catch (error) {
    console.error('Google SSO error:', error);
    return done(error, null);
  }
}));
}

// Configure Microsoft OAuth2 Strategy (only if credentials are available)
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(new MicrosoftStrategy({
  clientID: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  callbackURL: `${process.env.REACT_APP_API_URL}/api/sso/microsoft/callback`,
  scope: ['openid', 'profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Find or create user
    let user = await User.findOne({
      $or: [
        { email: profile.emails[0].value },
        { ssoProvider: 'microsoft', ssoId: profile.id }
      ]
    });

    if (!user) {
      // Create new user
      user = new User({
        name: profile.displayName,
        email: profile.emails[0].value,
        avatar: profile.photos[0]?.value,
        ssoProvider: 'microsoft',
        ssoId: profile.id,
        isSSOUser: true,
        isEmailVerified: true,
        password: Math.random().toString(36).slice(-8),
        roles: ['user']
      });

      await user.save();
      
      await logSecurityEvent('sso_user_created', user, {
        metadata: {
          provider: 'microsoft',
          profileId: profile.id
        }
      });
    } else {
      if (!user.ssoProvider || !user.ssoId) {
        user.ssoProvider = 'microsoft';
        user.ssoId = profile.id;
        user.isSSOUser = true;
        await user.save();
      }

      await logUserAction(user, 'login', 'sso', {
        metadata: {
          provider: 'microsoft',
          profileId: profile.id
        }
      });
    }

    return done(null, user);
  } catch (error) {
    console.error('Microsoft SSO error:', error);
    return done(error, null);
  }
}));
}

// Configure SAML Strategy (for enterprise SSO) - only if SAML credentials are available
if (process.env.SAML_ENTRY_POINT && process.env.SAML_ISSUER && process.env.SAML_CERT) {
  passport.use(new SamlStrategy({
  entryPoint: process.env.SAML_ENTRY_POINT,
  issuer: process.env.SAML_ISSUER,
  callbackUrl: `${process.env.REACT_APP_API_URL}/api/sso/saml/callback`,
  cert: process.env.SAML_CERT
}, async (profile, done) => {
  try {
    // Find or create user
    let user = await User.findOne({
      $or: [
        { email: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] },
        { ssoProvider: 'saml', ssoId: profile.nameID }
      ]
    });

    if (!user) {
      user = new User({
        name: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
        email: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
        ssoProvider: 'saml',
        ssoId: profile.nameID,
        isSSOUser: true,
        isEmailVerified: true,
        password: Math.random().toString(36).slice(-8),
        roles: ['user']
      });

      await user.save();
      
      await logSecurityEvent('sso_user_created', user, {
        metadata: {
          provider: 'saml',
          profileId: profile.nameID
        }
      });
    } else {
      if (!user.ssoProvider || !user.ssoId) {
        user.ssoProvider = 'saml';
        user.ssoId = profile.nameID;
        user.isSSOUser = true;
        await user.save();
      }

      await logUserAction(user, 'login', 'sso', {
        metadata: {
          provider: 'saml',
          profileId: profile.nameID
        }
      });
    }

    return done(null, user);
  } catch (error) {
    console.error('SAML SSO error:', error);
    return done(error, null);
  }
}));
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const user = req.user;
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Update last login
      user.lastLoginAt = new Date();
      user.lastLoginIP = req.ip;
      user.loginAttempts = 0;
      await user.save();

      // Redirect to frontend with token
      const redirectUrl = `${process.env.REACT_APP_URL}/auth/callback?token=${token}&provider=google`;
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.REACT_APP_URL}/login?error=auth_failed`);
    }
  }
);

// Microsoft OAuth routes
router.get('/microsoft', passport.authenticate('microsoft', { 
  prompt: 'select_account'
}));

router.get('/microsoft/callback',
  passport.authenticate('microsoft', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const user = req.user;
      
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      user.lastLoginAt = new Date();
      user.lastLoginIP = req.ip;
      user.loginAttempts = 0;
      await user.save();

      const redirectUrl = `${process.env.REACT_APP_URL}/auth/callback?token=${token}&provider=microsoft`;
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('Microsoft callback error:', error);
      res.redirect(`${process.env.REACT_APP_URL}/login?error=auth_failed`);
    }
  }
);

// SAML routes
router.get('/saml', passport.authenticate('saml', {
  failureRedirect: '/login',
  successRedirect: '/auth/saml/callback'
}));

router.post('/saml/callback',
  passport.authenticate('saml', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const user = req.user;
      
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      user.lastLoginAt = new Date();
      user.lastLoginIP = req.ip;
      user.loginAttempts = 0;
      await user.save();

      const redirectUrl = `${process.env.REACT_APP_URL}/auth/callback?token=${token}&provider=saml`;
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('SAML callback error:', error);
      res.redirect(`${process.env.REACT_APP_URL}/login?error=auth_failed`);
    }
  }
);

// SSO metadata endpoint (for SAML)
router.get('/saml/metadata', (req, res) => {
  try {
    const metadata = `
    <?xml version="1.0"?>
    <md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${process.env.SAML_ISSUER}">
      <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${process.env.REACT_APP_API_URL}/api/sso/slo"/>
        <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
        <md:AssertionConsumerService index="0" Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${process.env.REACT_APP_API_URL}/api/sso/saml/callback"/>
      </md:SPSSODescriptor>
    </md:EntityDescriptor>`;

    res.set('Content-Type', 'application/xml');
    res.send(metadata);

  } catch (error) {
    console.error('SAML metadata error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate SAML metadata',
      code: 'METADATA_ERROR'
    });
  }
});

// Get SSO configuration
router.get('/config', async (req, res) => {
  try {
    const config = {
      google: {
        enabled: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
        clientId: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '...' : null
      },
      microsoft: {
        enabled: !!process.env.MICROSOFT_CLIENT_ID && !!process.env.MICROSOFT_CLIENT_SECRET,
        clientId: process.env.MICROSOFT_CLIENT_ID ? process.env.MICROSOFT_CLIENT_ID.substring(0, 10) + '...' : null
      },
      saml: {
        enabled: !!process.env.SAML_ENTRY_POINT && !!process.env.SAML_ISSUER,
        issuer: process.env.SAML_ISSUER
      }
    };

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Get SSO config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SSO configuration',
      code: 'CONFIG_ERROR'
    });
  }
});

// Link SSO account to existing user
router.post('/link', async (req, res) => {
  try {
    const { provider, ssoId, token } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    // Check if SSO account is already linked to another user
    const existingUser = await User.findOne({ ssoProvider: provider, ssoId });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'SSO account is already linked to another user',
        code: 'SSO_ALREADY_LINKED'
      });
    }

    // Link SSO account to user
    user.ssoProvider = provider;
    user.ssoId = ssoId;
    user.isSSOUser = true;
    await user.save();

    await logUserAction(user, 'link_sso', 'user', {
      metadata: { provider, ssoId }
    });

    res.json({
      success: true,
      message: 'SSO account linked successfully',
      data: user
    });

  } catch (error) {
    console.error('Link SSO error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link SSO account',
      code: 'SSO_LINK_ERROR'
    });
  }
});

// Unlink SSO account
router.post('/unlink', async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    if (!user.isSSOUser) {
      return res.status(400).json({
        success: false,
        message: 'No SSO account linked',
        code: 'NO_SSO_LINKED'
      });
    }

    const provider = user.ssoProvider;
    const ssoId = user.ssoId;

    // Unlink SSO account
    user.ssoProvider = null;
    user.ssoId = null;
    user.isSSOUser = false;
    await user.save();

    await logUserAction(user, 'unlink_sso', 'user', {
      metadata: { provider, ssoId }
    });

    res.json({
      success: true,
      message: 'SSO account unlinked successfully'
    });

  } catch (error) {
    console.error('Unlink SSO error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlink SSO account',
      code: 'SSO_UNLINK_ERROR'
    });
  }
});

// Get SSO statistics
router.get('/statistics', async (req, res) => {
  try {
    const stats = {
      totalSSOUsers: await User.countDocuments({ isSSOUser: true }),
      googleUsers: await User.countDocuments({ ssoProvider: 'google' }),
      microsoftUsers: await User.countDocuments({ ssoProvider: 'microsoft' }),
      samlUsers: await User.countDocuments({ ssoProvider: 'saml' }),
      recentSSOLogins: await User.countDocuments({
        isSSOUser: true,
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get SSO statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SSO statistics',
      code: 'STATISTICS_ERROR'
    });
  }
});

// SSO health check
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        google: {
          configured: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
          status: 'ok'
        },
        microsoft: {
          configured: !!process.env.MICROSOFT_CLIENT_ID && !!process.env.MICROSOFT_CLIENT_SECRET,
          status: 'ok'
        },
        saml: {
          configured: !!process.env.SAML_ENTRY_POINT && !!process.env.SAML_ISSUER,
          status: 'ok'
        }
      }
    };

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    console.error('SSO health check error:', error);
    res.status(500).json({
      success: false,
      message: 'SSO health check failed',
      code: 'HEALTH_CHECK_ERROR'
    });
  }
});

export default router;
