let getTokenFn = null;
let signOutFn = null;

export const registerAuthHandlers = ({ getToken, signOut }) => {
  getTokenFn = getToken;
  signOutFn = signOut;
};

export const getAuthToken = async () => {
  if (!getTokenFn) return null;
  return getTokenFn();
};

export const clerkSignOut = async () => {
  if (signOutFn) await signOutFn();
};
