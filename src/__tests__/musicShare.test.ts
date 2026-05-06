/**
 * @jest-environment node
 */

// Stub native modules not available in Node environment
jest.mock('react-native', () => ({ Share: { share: jest.fn() }, Platform: { OS: 'ios' } }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({ deleteAsync: jest.fn() }));

import { spotifyUriToWebUrl } from '../utils/musicShare';

describe('spotifyUriToWebUrl', () => {
  it('converts a spotify track URI to a web URL', () => {
    expect(spotifyUriToWebUrl('spotify:track:4uLU6hMCjMI75M1A2tKUQC')).toBe(
      'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC'
    );
  });

  it('converts a spotify album URI', () => {
    expect(spotifyUriToWebUrl('spotify:album:1DFixLWuPkv3KT3TnV35m3')).toBe(
      'https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3'
    );
  });

  it('converts a spotify artist URI', () => {
    expect(spotifyUriToWebUrl('spotify:artist:3TVXtAsR1Inumwj472S9r4')).toBe(
      'https://open.spotify.com/artist/3TVXtAsR1Inumwj472S9r4'
    );
  });

  it('returns already-valid https URLs unchanged', () => {
    const url = 'https://open.spotify.com/track/abc123';
    expect(spotifyUriToWebUrl(url)).toBe(url);
  });

  it('returns http URLs unchanged', () => {
    const url = 'http://open.spotify.com/track/abc123';
    expect(spotifyUriToWebUrl(url)).toBe(url);
  });

  it('returns unrecognised strings unchanged', () => {
    expect(spotifyUriToWebUrl('not-a-uri')).toBe('not-a-uri');
  });

  it('handles an empty string without throwing', () => {
    expect(spotifyUriToWebUrl('')).toBe('');
  });
});
