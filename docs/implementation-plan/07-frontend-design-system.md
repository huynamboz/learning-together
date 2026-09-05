# Frontend design system plan

## 1. Art direction

Định hướng: **language lab notebook** — cảm giác một phòng luyện thi có nhịp độ, dấu vết tiến bộ và các “practice instruments”, thay vì dashboard SaaS với các card tròn giống nhau. Một vật thể nhận diện là đường “study trail”: nét đánh dấu chạy qua các mốc học, dùng để diễn đạt tiến trình chứ không làm nền trang trí.

## 2. Token ban đầu

### Color

| Token | Hex | Vai trò |
| --- | --- | --- |
| Ink night | `#17213F` | chữ chính, nav active |
| Iris | `#5D5FEF` | action chính, focus, progress |
| Bean gold | `#F4B942` | XP, streak, highlight thành tựu |
| Leaf mint | `#62C7A5` | correct/success, listening |
| Paper | `#F6F7FB` | nền app |
| Chalk | `#FFFFFF` | surface và editor |

Semantic tokens: `success`, `warning`, `danger`, `info`, `muted` phải có cặp text/background đạt WCAG AA. Không dùng gradient làm mặc định; chỉ dùng một accent wash cho hero/celebration.

### Typography

- `Be Vietnam Pro`: toàn bộ UI tiếng Việt, body và controls; weights 400/500/600/700.
- `Be Vietnam Pro` display ở 700/800 với tracking chặt cho headline; khác biệt đến từ scale, line break và ink treatment chứ không lạm dụng nhiều font.
- Body 15–16px, line-height 1.55; labels sentence case, không all-caps.

### Shape/space

- App shell 12px radius; controls 10px; card lớn 18px; không dùng một radius cho mọi thứ.
- 4px base spacing, content max-width 1280px.
- border `#E3E7F0` mảnh; shadow thấp, chỉ cho floating layer.
- active state có line/marker rõ, không chỉ đổi background.

## 3. Component families

- `AppShell`, `TopNav`, `MobileNav`, `MoreMenu`, `AccountMenu`.
- `StudyTrail`, `ProgressRing`, `MetricStrip`, `GoalBoard`, `ActivityTimeline`.
- `PracticeCard`, `LessonCard`, `QuestionRenderer`, `AnswerOption`, `ExplanationPanel`.
- `AudioPlayer`, `Transcript`, `SpeedControl`, `DictationInput`, `ExamTimer`.
- `Flashcard`, `SrsRatingBar`, `GameBoard`, `WordChip`.
- `WritingEditor`, `WordCounter`, `AiGradePanel`, `CreditBadge`.
- `FilterBar`, `SegmentedTabs`, `VirtualTable`, `BulkToolbar`.
- `UploadQueue`, `DropZone`, `MediaPreview`, `ImportReport`, `DiffViewer`.
- `ChatDock`, `PostComposer`, `FeedItem`, `CommentThread`.
- `Toast`, `ConfirmDialog`, `CommandMenu`, `Skeleton`, `EmptyState`, `ErrorState`.

Components own interaction semantics and keyboard states; pages compose them, không copy-paste style rules.

## 4. Layout wireframes

### Dashboard

```text
+-------------------- top nav: wordmark / study areas / account ------------------+
| greeting + next best action                         | study trail / streak      |
+-----------------------------------------------------+----------------------------+
| current score | target score | exam date | XP/streak                             |
+-------------------------------------------------------------------------------+
| today goals: 5 visual checkpoints                       | recent study timeline    |
+----------------------------------------------------------+-------------------------+
| continue cards: listen / read / vocab / test / video                         |
+-------------------------------------------------------------------------------+
```

### Practice runner

```text
+---------------- runner bar: exit | lesson | progress | timer | tools -----------+
| context/transcript/image                       | question + answer controls  |
| audio controls / notes / vocab                  | explanation / next action    |
+-------------------------------------------------------------------------------+
```

### Admin content workspace

```text
+ admin rail + command search --------------------------------------------------+
| filters + saved views | bulk toolbar                                         |
| virtualized content table                                                     |
|                                     | inspector/editor + live preview       |
+-------------------------------------------------------------------------------+
```

## 5. Motion

- page load: one orchestrated study-trail draw/reveal, 450–650ms;
- action response: progress mark, answer reveal, upload row state, toast;
- drag/drop: ghost and target affordance;
- avoid animating every card on scroll;
- `prefers-reduced-motion` disables nonessential motion;
- no animation may delay typing, audio controls or answer submission.

## 6. Accessibility and responsive

- keyboard order follows visual order; focus ring uses Iris + 2px offset;
- all icon-only buttons have accessible name;
- color plus icon/text for correct/wrong/PRO;
- touch targets minimum 44px;
- desktop split panes collapse into bottom sheets/stacked flow on mobile;
- audio/video controls usable without hover;
- Vietnamese copy uses plain verbs and stable action labels.

## 7. Review gate trước khi code UI

Trước khi build component, review screenshot/wireframe against: recognizability as Đậu TOEIC, hierarchy, density, mobile behavior, focus, empty/error states, and whether any piece became a generic rounded-card kit. Remove one decorative element if it does not aid learning or navigation.
