import { Readable } from 'node:stream';
import { MediaController } from './media.controller';

describe('MediaController', () => {
  it('marks public playback responses as cross-origin resources for the web app', async () => {
    const service = { openPublicAsset: jest.fn().mockResolvedValue({ stream: Readable.from(['audio']), size: 5, mimeType: 'audio/wav', originalName: 'lesson.wav' }) };
    const response = { setHeader: jest.fn() };
    const result = await new MediaController(service as never).file('asset-1', response as never);
    expect(result).toBeDefined();
    expect(response.setHeader).toHaveBeenCalledWith('Cross-Origin-Resource-Policy', 'cross-origin');
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'audio/wav');
  });
});
