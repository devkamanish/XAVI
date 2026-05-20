
export const parseMentions = (content: string): string[] => {
  const mentionRegex = /@([\w.-]+@[\w.-]+\.\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1].toLowerCase());
  }

  
  return [...new Set(mentions)];
};
