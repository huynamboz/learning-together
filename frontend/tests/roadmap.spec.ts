import { describe, expect, it } from 'vitest';
import { evaluateRoadmap, findTrack, roadmapLayout, roadmapTracks, roadPath, stageProgressLabel, type SurfaceProgress } from '../utils/roadmap';

const toeic = findTrack('toeic')!;

const progress = (partial: Partial<SurfaceProgress> = {}): SurfaceProgress => ({
  listeningAnswered: 0, readingAnswered: 0, grammarAnswered: 0, vocabularyReviewed: 0,
  writingSubmitted: 0, writingGraded: 0, videoSeconds: 0, examsCompleted: 0, bestExamScore: null, ...partial
});

describe('the tracks on offer', () => {
  it('covers the four exams the nav promises', () => {
    expect(roadmapTracks.map((track) => track.slug)).toEqual(['toeic', 'ielts', 'toefl', 'vstep']);
  });

  it('marks only the track the platform actually has content for as live', () => {
    // Saying a track is ready when there is nothing behind it is the one thing this page must not do.
    expect(roadmapTracks.filter((track) => track.status === 'live').map((track) => track.slug)).toEqual(['toeic']);
  });

  it('sends every live stage to a surface that exists', () => {
    const live = roadmapTracks.filter((track) => track.status === 'live');
    const surfaces = ['/listen', '/read', '/write', '/vocabulary', '/mock-test', '/video'];
    for (const track of live) for (const stage of track.stages) expect(surfaces).toContain(stage.to);
  });

  it('returns nothing for a slug that is not a track', () => {
    expect(findTrack('goethe')).toBeNull();
    expect(findTrack(undefined)).toBeNull();
  });
});

describe('where the learner stands', () => {
  it('starts everyone on the first stage with nothing unlocked behind it', () => {
    const result = evaluateRoadmap(toeic, progress());
    expect(result.stages[0].status).toBe('current');
    expect(result.stages.slice(1).every((stage) => stage.status === 'locked')).toBe(true);
    expect(result.doneCount).toBe(0);
    expect(result.percent).toBe(0);
  });

  it('treats a signed-out visitor the same as someone with no progress, not as an error', () => {
    expect(evaluateRoadmap(toeic, null).stages[0].status).toBe('current');
  });

  it('moves the marker forward once a stage target is met', () => {
    const result = evaluateRoadmap(toeic, progress({ examsCompleted: 1 }));
    expect(result.stages[0].status).toBe('done');
    expect(result.stages[1].status).toBe('current');
    expect(result.currentIndex).toBe(1);
  });

  it('does not let a later stage unlock just because its own counter happens to be high', () => {
    // 3 exams also satisfies the final stage, but the route between them has not been walked.
    const result = evaluateRoadmap(toeic, progress({ examsCompleted: 3 }));
    expect(result.stages[0].status).toBe('done');
    expect(result.stages.at(-1)!.status).toBe('locked');
  });

  it('reports a finished track with no current stage left to point at', () => {
    const result = evaluateRoadmap(toeic, progress({
      examsCompleted: 3, vocabularyReviewed: 40, grammarAnswered: 60,
      listeningAnswered: 120, readingAnswered: 80, writingSubmitted: 2
    }));
    expect(result.doneCount).toBe(result.total);
    expect(result.percent).toBe(100);
    expect(result.currentIndex).toBe(-1);
  });

  it('shows partial progress on the stage being worked on', () => {
    const stage = evaluateRoadmap(toeic, progress({ examsCompleted: 1, vocabularyReviewed: 10 })).stages[1];
    expect(stage.status).toBe('current');
    expect(stage.ratio).toBeCloseTo(0.25);
    expect(stageProgressLabel(stage)).toBe('10/40 thẻ đã ôn');
  });

  it('never reports more progress than the stage asks for', () => {
    const stage = evaluateRoadmap(toeic, progress({ examsCompleted: 99 })).stages[0];
    expect(stage.achieved).toBe(1);
    expect(stage.ratio).toBe(1);
    expect(stageProgressLabel(stage)).toBe('Đã xong');
  });

  it('states what a locked stage will ask for instead of a fraction that reads as finished', () => {
    // The learner has met the writing stage's own target, but has not walked the route to it.
    const stages = evaluateRoadmap(toeic, progress({ examsCompleted: 3, writingSubmitted: 2 })).stages;
    const writing = stages.find((stage) => stage.key === 'writing')!;
    expect(writing.status).toBe('locked');
    expect(stageProgressLabel(writing)).toBe('Cần 2 bài đã nộp');
    expect(stageProgressLabel(writing)).not.toContain('/');
  });

  it('marks the last stage as the finish line', () => {
    const stages = evaluateRoadmap(toeic, progress()).stages;
    expect(stages.filter((stage) => stage.isFinal)).toHaveLength(1);
    expect(stages.at(-1)!.isFinal).toBe(true);
  });
});

describe('a track with no lessons behind it', () => {
  const ielts = findTrack('ielts')!;

  it('credits nothing from another exam the learner did take', () => {
    // The learner has finished TOEIC exams; that says nothing about an IELTS diagnostic.
    const result = evaluateRoadmap(ielts, progress({ examsCompleted: 9, readingAnswered: 500 }));
    expect(result.doneCount).toBe(0);
    expect(result.percent).toBe(0);
    expect(result.stages.every((stage) => stage.status === 'locked')).toBe(true);
  });

  it('points at no current stage, because none of them are open', () => {
    expect(evaluateRoadmap(ielts, progress({ examsCompleted: 9 })).currentIndex).toBe(-1);
  });
});

describe('the shape of the road', () => {
  it('alternates sides so the route bends instead of running straight down', () => {
    const { nodes } = roadmapLayout(4, { width: 600 });
    expect(nodes.map((node) => node.x)).toEqual([180, 420, 180, 420]);
    expect(nodes.map((node) => node.y)).toEqual([90, 280, 470, 660]);
  });

  it('grows tall enough to hold every stage', () => {
    expect(roadmapLayout(8, { spacing: 190, margin: 90 }).height).toBe(90 * 2 + 7 * 190);
  });

  it('survives a track with one stage or none', () => {
    expect(roadmapLayout(1).nodes).toHaveLength(1);
    expect(roadmapLayout(1).path).toBe('');
    expect(roadmapLayout(0).nodes).toEqual([]);
  });

  it('draws one curve per gap between stages', () => {
    const path = roadPath([{ x: 10, y: 0 }, { x: 90, y: 100 }, { x: 10, y: 200 }]);
    expect(path.startsWith('M 10 0')).toBe(true);
    expect(path.match(/C/g)).toHaveLength(2);
  });
});
