/**
 * Chit-chat replies (no Claude). Kept in its own module so eval:chat
 * can import it without loading the catalog / Postgres pool.
 */

export const HELP_TAIL = " What can I help you with today?";

function pick(options: string[]): string {
  return options[Math.floor(Math.random() * options.length)];
}

const SMALL_TALK_RESPONSES: Record<string, string[]> = {
  greeting: [
    `Hello! I'm Vesta, your fashion mentor.${HELP_TAIL}`,
    `Hi there! I can help with outfits, colors, and pieces to shop.${HELP_TAIL}`,
    `Welcome! Looking for style advice, a specific garment, or a full look?`,
  ],
  thanks: [
    `You're welcome!${HELP_TAIL}`,
    `Anytime — fashion is what I'm here for.${HELP_TAIL}`,
    `My pleasure. Want outfit ideas, color advice, or something to browse?`,
  ],
  goodbye: [
    "Goodbye! Come back when you need more style inspiration.",
    "Take care — stay stylish. I'll be here when you want outfit ideas.",
    "See you later! Ping me anytime for styling help.",
  ],
  how_are_you: [
    `I'm doing great and ready to talk fashion.${HELP_TAIL}`,
    `Wonderful, thanks for asking!${HELP_TAIL}`,
    `All good here. Want help with an outfit, a color, or something to shop?`,
  ],
  who: [
    `I'm Vesta, a fashion mentor. I can suggest outfits, colors, similar pieces, and shoppable looks.${HELP_TAIL}`,
    `I'm your style companion — combine looks, browse garments, or talk color.${HELP_TAIL}`,
  ],
  ack: [
    `Got it.${HELP_TAIL}`,
    `Sounds good.${HELP_TAIL}`,
    `Alright.${HELP_TAIL}`,
  ],
  nudge: [
    `I'm here for style questions — outfits, colors, or pieces to browse.${HELP_TAIL}`,
    `Happy to help with fashion.${HELP_TAIL}`,
  ],
};

const GREETING_RE =
  /^(hi+|hello|hey+|yo|hiya|howdy|heya|greetings|good (morning|afternoon|evening|night)|sup|what'?s up|whats up)( there| friend)?[\s!.?,]*$/i;
const HOW_ARE_RE =
  /^(how are you( doing)?|how'?s it going|how is it going|how('re| are) you today|how have you been|how was your (day|weekend)|what'?s going on)[\s!.?,]*$/i;
const THANKS_RE =
  /^(thanks|thank you|thx|ty|cheers|appreciate it)( so much)?[\s!.?,]*$/i;
const BYE_RE =
  /^(bye|goodbye|see you|see ya|farewell|later|cya)[\s!.?,]*$/i;
const WHO_RE =
  /^(who are you|what('?s| is) your name|what are you|what can you do|what do you do|help( me)?|what can you help (me )?with)[\s!.?,]*$/i;
const ACK_RE =
  /^(ok|okay|k|cool|nice|great|awesome|lol|haha|sure|yeah|yep|yup|wow|hmm+|oh|alright|all right)[\s!.?,]*$/i;
const CHITCHAT_RE =
  /^(how'?s the weather|what'?s the weather( like)?|nice (day|weather)|tell me a joke)[\s!.?,]*$/i;

/** Friendly chit-chat instead of “I don’t understand.” Returns null if this is a real styling ask. */
export function trySmallTalkReply(query: string): string | null {
  const text = (query || "").toLowerCase().trim();
  if (!text) {
    return pick(SMALL_TALK_RESPONSES.nudge);
  }
  if (GREETING_RE.test(text)) return pick(SMALL_TALK_RESPONSES.greeting);
  if (HOW_ARE_RE.test(text)) return pick(SMALL_TALK_RESPONSES.how_are_you);
  if (THANKS_RE.test(text)) return pick(SMALL_TALK_RESPONSES.thanks);
  if (BYE_RE.test(text)) return pick(SMALL_TALK_RESPONSES.goodbye);
  if (WHO_RE.test(text)) return pick(SMALL_TALK_RESPONSES.who);
  if (ACK_RE.test(text)) return pick(SMALL_TALK_RESPONSES.ack);
  if (CHITCHAT_RE.test(text)) {
    return `I can chat, but I'm at my best with style.${HELP_TAIL}`;
  }
  if (text === "?" || text.length < 3) {
    return pick(SMALL_TALK_RESPONSES.nudge);
  }
  return null;
}
