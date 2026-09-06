/**
 * Study roadmaps: an ordered route through the platform for one exam.
 *
 * A roadmap is only useful if it says something true, so a stage is marked done from the learner's
 * real counters rather than from a stored "completed" flag someone could set by clicking around.
 * Tracks the platform has no content for yet say so plainly instead of showing an empty road.
 */

export type SurfaceKey =
  | 'listeningAnswered' | 'readingAnswered' | 'grammarAnswered' | 'vocabularyReviewed'
  | 'writingSubmitted' | 'writingGraded' | 'videoSeconds' | 'examsCompleted';

export type SurfaceProgress = Record<SurfaceKey, number> & { bestExamScore: number | null };

export type RoadmapStage = {
  key: string;
  title: string;
  detail: string;
  icon: string;
  /** Where this stage is actually practised. */
  to: string;
  /** What has to happen for the stage to count as done, in the learner's own numbers. */
  requirement: { surface: SurfaceKey; target: number; unit: string };
};

export type RoadmapTrack = {
  slug: string;
  exam: string;
  title: string;
  tagline: string;
  /** Honest status: only TOEIC has content on the platform today. */
  status: 'live' | 'planned';
  accent: string;
  accentSoft: string;
  icon: string;
  audience: string;
  duration: string;
  bands: string;
  stages: RoadmapStage[];
};

export const roadmapTracks: ReadonlyArray<RoadmapTrack> = [
  {
    slug: 'toeic',
    exam: 'TOEIC',
    title: 'Lộ trình TOEIC Listening & Reading',
    tagline: 'Từ chỗ chưa quen format tới một bài thi thử trọn vẹn 200 câu.',
    status: 'live',
    accent: '#EF6C57',
    accentSoft: '#FFE6E2',
    icon: 'solar:clipboard-list-bold',
    audience: 'Người đi làm và sinh viên cần chứng chỉ đầu ra',
    duration: 'Khoảng 12 tuần · 1 giờ/ngày',
    bands: 'Mục tiêu 450 → 750+',
    stages: [
      { key: 'format', title: 'Làm quen format đề', detail: 'Biết bảy part hỏi gì và tính giờ ra sao trước khi luyện.', icon: 'solar:compass-bold', to: '/mock-test', requirement: { surface: 'examsCompleted', target: 1, unit: 'đề đã làm' } },
      { key: 'vocabulary', title: 'Từ vựng nền công sở', detail: 'Bộ từ lặp lại nhiều nhất trong Part 3, 4 và 7.', icon: 'solar:book-bookmark-bold', to: '/vocabulary', requirement: { surface: 'vocabularyReviewed', target: 40, unit: 'thẻ đã ôn' } },
      { key: 'grammar', title: 'Ngữ pháp Part 5', detail: 'Những cấu trúc chiếm phần lớn điểm mất ở Reading.', icon: 'solar:text-square-bold', to: '/read', requirement: { surface: 'grammarAnswered', target: 60, unit: 'câu đã làm' } },
      { key: 'listening-basics', title: 'Nghe Part 1 và 2', detail: 'Bắt ý chính của câu ngắn, không kịp ghi vẫn chọn được.', icon: 'solar:headphones-round-sound-bold', to: '/listen', requirement: { surface: 'listeningAnswered', target: 40, unit: 'câu đã nghe' } },
      { key: 'reading-passages', title: 'Đọc Part 6 và 7', detail: 'Đọc lấy thông tin trong thời gian có hạn.', icon: 'solar:book-2-bold', to: '/read', requirement: { surface: 'readingAnswered', target: 80, unit: 'câu đã đọc' } },
      { key: 'listening-long', title: 'Nghe Part 3 và 4', detail: 'Hội thoại và bài nói dài, đọc câu hỏi trước khi audio chạy.', icon: 'solar:soundwave-square-bold', to: '/listen', requirement: { surface: 'listeningAnswered', target: 120, unit: 'câu đã nghe' } },
      { key: 'writing', title: 'Viết email công việc', detail: 'Phần không tính điểm L&R nhưng giữ nhịp dùng tiếng Anh thật.', icon: 'solar:pen-new-square-bold', to: '/write', requirement: { surface: 'writingSubmitted', target: 2, unit: 'bài đã nộp' } },
      { key: 'full-test', title: 'Thi thử trọn đề', detail: 'Hai giờ liên tục, đúng áp lực thời gian của phòng thi.', icon: 'solar:cup-star-bold', to: '/mock-test', requirement: { surface: 'examsCompleted', target: 3, unit: 'đề đã làm' } }
    ]
  },
  {
    slug: 'ielts',
    exam: 'IELTS',
    title: 'Lộ trình IELTS Academic',
    tagline: 'Bốn kỹ năng, chấm theo band và có phần nói trực tiếp.',
    status: 'planned',
    accent: '#1CB0F6',
    accentSoft: '#E8F7FF',
    icon: 'solar:book-2-bold',
    audience: 'Người chuẩn bị du học hoặc định cư',
    duration: 'Khoảng 16 tuần · 1.5 giờ/ngày',
    bands: 'Mục tiêu band 5.5 → 7.0',
    stages: [
      { key: 'diagnostic', title: 'Kiểm tra đầu vào', detail: 'Xác định band hiện tại của từng kỹ năng.', icon: 'solar:compass-bold', to: '/lo-trinh/ielts', requirement: { surface: 'examsCompleted', target: 1, unit: 'bài test' } },
      { key: 'listening', title: 'Listening 4 section', detail: 'Điền form, bản đồ và bài giảng học thuật.', icon: 'solar:headphones-round-sound-bold', to: '/lo-trinh/ielts', requirement: { surface: 'listeningAnswered', target: 80, unit: 'câu' } },
      { key: 'reading', title: 'Reading học thuật', detail: 'Ba bài dài với dạng True/False/Not Given.', icon: 'solar:book-2-bold', to: '/lo-trinh/ielts', requirement: { surface: 'readingAnswered', target: 80, unit: 'câu' } },
      { key: 'writing', title: 'Writing Task 1 và 2', detail: 'Mô tả biểu đồ và bài luận quan điểm.', icon: 'solar:pen-new-square-bold', to: '/lo-trinh/ielts', requirement: { surface: 'writingSubmitted', target: 8, unit: 'bài' } },
      { key: 'speaking', title: 'Speaking ba phần', detail: 'Phỏng vấn, nói dài hai phút và thảo luận.', icon: 'solar:microphone-large-bold', to: '/lo-trinh/ielts', requirement: { surface: 'writingGraded', target: 4, unit: 'buổi' } },
      { key: 'mock', title: 'Thi thử tính band', detail: 'Trọn bộ bốn kỹ năng trong một buổi.', icon: 'solar:cup-star-bold', to: '/lo-trinh/ielts', requirement: { surface: 'examsCompleted', target: 3, unit: 'bài thi thử' } }
    ]
  },
  {
    slug: 'toefl',
    exam: 'TOEFL',
    title: 'Lộ trình TOEFL iBT',
    tagline: 'Thi trên máy, các kỹ năng lồng vào nhau trong cùng một câu hỏi.',
    status: 'planned',
    accent: '#8A63D2',
    accentSoft: '#F0EAFB',
    icon: 'solar:monitor-smartphone-bold',
    audience: 'Ứng viên đại học Bắc Mỹ',
    duration: 'Khoảng 14 tuần · 1.5 giờ/ngày',
    bands: 'Mục tiêu 60 → 95+',
    stages: [
      { key: 'format', title: 'Làm quen thi trên máy', detail: 'Thao tác, ghi chú và cách tính giờ từng phần.', icon: 'solar:compass-bold', to: '/lo-trinh/toefl', requirement: { surface: 'examsCompleted', target: 1, unit: 'bài test' } },
      { key: 'reading', title: 'Reading học thuật', detail: 'Bài dài với câu hỏi chèn câu và tóm tắt.', icon: 'solar:book-2-bold', to: '/lo-trinh/toefl', requirement: { surface: 'readingAnswered', target: 60, unit: 'câu' } },
      { key: 'listening', title: 'Listening bài giảng', detail: 'Nghe giảng đường và hội thoại trong trường.', icon: 'solar:headphones-round-sound-bold', to: '/lo-trinh/toefl', requirement: { surface: 'listeningAnswered', target: 60, unit: 'câu' } },
      { key: 'integrated', title: 'Kỹ năng tích hợp', detail: 'Đọc rồi nghe rồi nói hoặc viết lại nội dung.', icon: 'solar:link-circle-bold', to: '/lo-trinh/toefl', requirement: { surface: 'writingSubmitted', target: 6, unit: 'bài' } },
      { key: 'mock', title: 'Thi thử trọn buổi', detail: 'Gần ba tiếng liên tục như đề thật.', icon: 'solar:cup-star-bold', to: '/lo-trinh/toefl', requirement: { surface: 'examsCompleted', target: 3, unit: 'bài thi thử' } }
    ]
  },
  {
    slug: 'vstep',
    exam: 'VSTEP',
    title: 'Lộ trình VSTEP bậc 3–5',
    tagline: 'Chuẩn Việt Nam, bốn kỹ năng và có phần nói với giám khảo.',
    status: 'planned',
    accent: '#58CC02',
    accentSoft: '#EAF8EF',
    icon: 'solar:diploma-verified-bold',
    audience: 'Giáo viên, viên chức và học viên sau đại học',
    duration: 'Khoảng 10 tuần · 1 giờ/ngày',
    bands: 'Mục tiêu bậc 3 → bậc 5',
    stages: [
      { key: 'format', title: 'Hiểu khung bậc 3–5', detail: 'Mỗi bậc yêu cầu gì và chấm theo tiêu chí nào.', icon: 'solar:compass-bold', to: '/lo-trinh/vstep', requirement: { surface: 'examsCompleted', target: 1, unit: 'bài test' } },
      { key: 'listening', title: 'Nghe ba phần', detail: 'Thông báo, hội thoại và bài nói dài.', icon: 'solar:headphones-round-sound-bold', to: '/lo-trinh/vstep', requirement: { surface: 'listeningAnswered', target: 50, unit: 'câu' } },
      { key: 'reading', title: 'Đọc bốn bài', detail: 'Bài đọc dài dần theo độ khó của bậc.', icon: 'solar:book-2-bold', to: '/lo-trinh/vstep', requirement: { surface: 'readingAnswered', target: 50, unit: 'câu' } },
      { key: 'writing', title: 'Viết hai task', detail: 'Thư và bài luận theo tiêu chí chấm VSTEP.', icon: 'solar:pen-new-square-bold', to: '/lo-trinh/vstep', requirement: { surface: 'writingSubmitted', target: 6, unit: 'bài' } },
      { key: 'speaking', title: 'Nói ba phần', detail: 'Tương tác xã hội, thảo luận giải pháp và phát triển ý.', icon: 'solar:microphone-large-bold', to: '/lo-trinh/vstep', requirement: { surface: 'writingGraded', target: 3, unit: 'buổi' } },
      { key: 'mock', title: 'Thi thử đủ bốn kỹ năng', detail: 'Một buổi liền mạch để xác định bậc.', icon: 'solar:cup-star-bold', to: '/lo-trinh/vstep', requirement: { surface: 'examsCompleted', target: 2, unit: 'bài thi thử' } }
    ]
  }
];

export function findTrack(slug: string | undefined): RoadmapTrack | null {
  return roadmapTracks.find((track) => track.slug === slug) ?? null;
}

export type StageStatus = 'done' | 'current' | 'locked';

export type EvaluatedStage = RoadmapStage & {
  index: number;
  status: StageStatus;
  achieved: number;
  /** 0–1, for the ring around the node. */
  ratio: number;
  isFinal: boolean;
};

export type EvaluatedRoadmap = {
  stages: EvaluatedStage[];
  doneCount: number;
  total: number;
  /** Index of the stage the learner is on, or -1 once the whole track is finished. */
  currentIndex: number;
  percent: number;
};

/**
 * Stages unlock in order. Meeting a later stage's target early does not skip the ones before it —
 * the route is the point, and letting someone jump to "thi thử" because they happened to open one
 * would be telling them they are ready when they are not.
 */
export function evaluateRoadmap(track: RoadmapTrack, progress: SurfaceProgress | null): EvaluatedRoadmap {
  // A planned track has no lessons behind it, so nothing the learner has done anywhere else counts
  // towards it. Reading TOEIC exam counts as IELTS progress would credit a test never taken.
  const measurable = track.status === 'live' ? progress : null;
  let blocked = track.status !== 'live';
  const stages = track.stages.map((stage, index) => {
    const achieved = Math.max(0, measurable?.[stage.requirement.surface] ?? 0);
    const target = Math.max(1, stage.requirement.target);
    let status: StageStatus;
    if (!blocked && achieved >= target) status = 'done';
    else if (!blocked) { status = 'current'; blocked = true; }
    else status = 'locked';
    return {
      ...stage,
      index,
      status,
      achieved: Math.min(achieved, target),
      ratio: Math.min(1, achieved / target),
      isFinal: index === track.stages.length - 1
    };
  });

  const doneCount = stages.filter((stage) => stage.status === 'done').length;
  return {
    stages,
    doneCount,
    total: stages.length,
    currentIndex: stages.findIndex((stage) => stage.status === 'current'),
    percent: stages.length ? Math.round((doneCount / stages.length) * 100) : 0
  };
}

export type RoadmapNode = { x: number; y: number };

export type RoadmapLayout = {
  width: number;
  height: number;
  nodes: RoadmapNode[];
  /** SVG path data for the road itself. */
  path: string;
};

/**
 * A serpentine route rather than a straight list: the bends are what make a long track feel like a
 * journey with a near end, and they give each stage its own place on the page instead of one more
 * row. Positions are computed rather than hand-placed so a track of any length still fits.
 */
export function roadmapLayout(count: number, options: { width?: number; spacing?: number; margin?: number } = {}): RoadmapLayout {
  const width = options.width ?? 600;
  const spacing = options.spacing ?? 190;
  const margin = options.margin ?? 90;
  const lanes = [width * 0.3, width * 0.7];

  const nodes: RoadmapNode[] = Array.from({ length: Math.max(0, count) }, (_, index) => ({
    x: lanes[index % 2],
    y: margin + index * spacing
  }));

  return { width, height: margin * 2 + Math.max(0, count - 1) * spacing, nodes, path: roadPath(nodes) };
}

/** Cubic segments with vertical handles, so the road leaves and enters every node straight down. */
export function roadPath(nodes: RoadmapNode[]): string {
  if (nodes.length < 2) return '';
  const [first, ...rest] = nodes;
  return rest.reduce((path, node, index) => {
    const previous = nodes[index];
    const handle = (node.y - previous.y) * 0.55;
    return `${path} C ${previous.x} ${previous.y + handle}, ${node.x} ${node.y - handle}, ${node.x} ${node.y}`;
  }, `M ${first.x} ${first.y}`);
}

/**
 * A locked stage states its requirement rather than a fraction: showing "2/2 bài đã nộp" under a
 * padlock claims the stage is finished and locked at the same time.
 */
export function stageProgressLabel(stage: EvaluatedStage): string {
  if (stage.status === 'done') return 'Đã xong';
  if (stage.status === 'locked') return `Cần ${stage.requirement.target} ${stage.requirement.unit}`;
  return `${stage.achieved}/${stage.requirement.target} ${stage.requirement.unit}`;
}
