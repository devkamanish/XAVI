// Parse @email mentions from comment content
export const parseMentions = (content: string): string[] => {
  const mentionRegex = /@([\w.-]+@[\w.-]+\.\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1].toLowerCase());
  }

  // Remove duplicates
  return [...new Set(mentions)];
};
