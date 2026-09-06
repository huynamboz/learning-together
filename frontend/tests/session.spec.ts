import { describe, expect, it } from 'vitest';
import { isAuthRejection, resolveSignedIn } from '../utils/session';

describe('who counts as signed in', () => {
  it('trusts the cookie only until the profile fetch settles', () => {
    expect(resolveSignedIn({ loaded: false, hasToken: true, hasUser: false })).toBe(true);
  });

  it('treats an expired token as signed out once the fetch comes back empty', () => {
    // The bug this guards: the admin gate greeted an expired session as "signed in as ‹nothing›".
    expect(resolveSignedIn({ loaded: true, hasToken: true, hasUser: false })).toBe(false);
  });

  it('counts a loaded profile as signed in', () => {
    expect(resolveSignedIn({ loaded: true, hasToken: true, hasUser: true })).toBe(true);
  });

  it('never claims a signed-in state with no token and no profile', () => {
    expect(resolveSignedIn({ loaded: false, hasToken: false, hasUser: false })).toBe(false);
    expect(resolveSignedIn({ loaded: true, hasToken: false, hasUser: false })).toBe(false);
  });
});

describe('which failures discard the token', () => {
  it('discards it when the server refuses the credential', () => {
    expect(isAuthRejection({ statusCode: 401 })).toBe(true);
    expect(isAuthRejection({ response: { status: 403 } })).toBe(true);
  });

  it('keeps it through a server error or a network blip, which say nothing about the token', () => {
    expect(isAuthRejection({ statusCode: 500 })).toBe(false);
    expect(isAuthRejection(new Error('fetch failed'))).toBe(false);
    expect(isAuthRejection(null)).toBe(false);
  });
});
