# Domain model và dữ liệu

## 1. Identity/access

- `User`: id, email, displayName, avatarAssetId, status, locale, timezone, createdAt.
- `AuthIdentity`: userId, provider, providerAccountId, passwordHash nullable.
- `Session`: refresh token hash, deviceId, expiresAt, revokedAt, lastSeenAt.
- `Device`: userId, deviceHash, type, browser, label, firstSeenAt, lastSeenAt, revokedAt.
- `Plan`, `Entitlement`, `FeatureLimit`: Free/PRO/Premium and effective period.
- `UserPreference`: theme, notification flags, study preferences.

## 2. Content

- `Course`, `CourseSection`, `Lesson`, `LessonVariant`.
- `Question`: kind (listening/reading/grammar/vocab/writing), part, level, prompt, explanation, answer schema, status.
- `QuestionOption`: questionId, key, text, mediaAssetId, sortOrder.
- `QuestionTranslation`: questionId, locale, text.
- `QuestionTag`, `Topic`, `Difficulty`, `SourceReference`.
- `VocabularyEntry`: lemma, pronunciation, partOfSpeech, meanings, examples, audioAssetId.
- `VocabularySet`, `VocabularySetItem`.
- `Video`, `VideoChapter`, `VideoProgress`.
- `BlogPost`, `BlogCategory`.

Content uses `draft → review → published → archived`; published versions are immutable snapshots so existing attempts remain reproducible.

## 3. Learning/progress

- `StudySession`: userId, surface, startedAt, endedAt, durationSeconds.
- `QuestionAttempt`: userId, questionId, contextType, contextId, selectedAnswer, isCorrect, timeMs, answerVersion, createdAt.
- `QuestionProgress`: userId, questionId, seenCount, correctCount, wrongCount, lastSeenAt, nextReviewAt.
- `SavedItem`: userId + targetType/targetId (vocab/note/wrong/question).
- `Note`: userId, targetType, targetId, body.
- `MockTest`, `MockTestPart`, `MockTestQuestion`, `ExamSession`, `ExamAnswer`, `ExamResult`.
- `WritingSubmission`, `WritingGrade`, `AiCreditLedger`.
- `SrsCard`: userId, vocabularyEntryId, state, dueAt, intervalDays, ease, lapses.
- `DailyGoal`, `DailyGoalProgress`, `Streak`, `XpLedger`, `ActivityEvent`.

Counters shown in UI are projections, not the source of truth. Rebuildable rollups are updated from attempts/ledger events.

## 4. Social/community

- `Post`, `PostTag`, `Comment`, `Reaction`, `PostFollow`.
- `FriendRequest`, `Friendship`, `ChatThread`, `ChatMessage`, `ChatReadState`, `Presence`.
- `Report`, `ModerationAction`, `ReputationEvent`.
- `Feedback`, `FeedbackAttachment`, `Proposal`, `ProposalAttachment`.

All user-generated content has moderation status, author, edit history where applicable and soft-delete metadata.

## 5. Commerce/referral

- `ProductPlan`, `Order`, `PaymentTransaction`, `PaymentWebhookEvent`, `Refund`.
- `AiCreditLedger` is append-only: grant, consume, expire, adjust; balance is derived and periodically reconciled.
- `ReferralAttribution`: referralCode, visitor fingerprint hash, firstTouchAt, expiresAt, referredUserId.
- `AffiliateTier`, `CommissionLedger`, `WithdrawalRequest`, `BankAccountToken`.

Never store raw card data. Bank details must be tokenized/encrypted or delegated to a payment provider.

## 6. Media/import/audit

- `MediaAsset`: provider, bucket, objectKey, originalName, mime, byteSize, checksum, width, height, duration, status, visibility.
- `UploadSession`, `UploadPart`, `UploadReference`.
- `ImportBatch`, `ImportItem`, `ImportError`, `ImportVersion`.
- `AuditLog`: actor, action, entity, entityId, before/after hash or redacted diff, requestId, createdAt.

## 7. Invariants

- unique `(userId, questionId)` cho progress/card;
- unique provider event id cho payment webhook;
- không consume AI credit nếu grading job chưa accepted;
- exam session chỉ submit một lần;
- published content version không sửa trực tiếp;
- không hiển thị private media nếu user chưa có entitlement;
- cascade delete tránh xóa audit/ledger; dùng retention + anonymization.
