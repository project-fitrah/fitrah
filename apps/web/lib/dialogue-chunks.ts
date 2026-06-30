const SENTENCE_PATTERN = /[^.!?…]+[.!?…]+|[^.!?…]+$/g;
const COMPLETE_SENTENCE_PATTERN = /[.!?…]$/;

export function splitIntoSentences(text: string): string[] {
  const trimmed = text.trim();

  if (!trimmed) {
    return [];
  }

  const parts = trimmed.match(SENTENCE_PATTERN);

  if (!parts) {
    return [];
  }

  return parts.map((part) => part.trim()).filter((part) => COMPLETE_SENTENCE_PATTERN.test(part));
}

export function getIncompleteSentenceTail(text: string): string {
  const trimmed = text.trim();

  if (!trimmed) {
    return "";
  }

  const completeSentences = splitIntoSentences(trimmed);

  if (completeSentences.length === 0) {
    return trimmed;
  }

  const lastSentence = completeSentences[completeSentences.length - 1]!;
  const lastSentenceIndex = trimmed.lastIndexOf(lastSentence);

  if (lastSentenceIndex === -1) {
    return "";
  }

  return trimmed.slice(lastSentenceIndex + lastSentence.length).trim();
}

export function chunkSentences(sentences: string[], sentencesPerChunk = 2): string[] {
  const chunks: string[] = [];

  for (let index = 0; index < sentences.length; index += sentencesPerChunk) {
    chunks.push(sentences.slice(index, index + sentencesPerChunk).join(" "));
  }

  return chunks;
}

export function buildDialogueView(text: string, chunkIndex: number, sentencesPerChunk = 2) {
  const sentences = splitIntoSentences(text);
  const chunks = chunkSentences(sentences, sentencesPerChunk);
  const incompleteTail = getIncompleteSentenceTail(text);
  const safeIndex = chunks.length === 0 ? 0 : Math.min(chunkIndex, chunks.length - 1);
  const isLastChunk = chunks.length === 0 || safeIndex >= chunks.length - 1;
  const currentChunk = chunks[safeIndex] ?? "";

  const displayText =
    chunks.length > 0
      ? isLastChunk
        ? [currentChunk, incompleteTail].filter(Boolean).join(" ")
        : currentChunk
      : incompleteTail;

  return {
    chunks,
    displayText,
    canAdvance: safeIndex < chunks.length - 1,
    chunkIndex: safeIndex,
    isLastChunk
  };
}
