"""
Intent Handler - Pre-processing layer for chatbot
Handles common human intents WITHOUT calling LLM / RAG
"""

from typing import Optional, Tuple, Dict, Any, List
import re
import random
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class IntentHandler:
    def __init__(self):

        # ==========================
        # GREETINGS
        # ==========================
        self.greeting_patterns = [
            r'\b(hi+|hey+|hello+|hii+|hai+|helo+|hola|yo+|sup+|howdy)\b',
            r'\b(good\s*(morning|afternoon|evening|night|day))\b',
            r'^(hi|hey|hello|hai)[\s!?.]*$',
        ]

        self.greeting_responses = [
            "Hey! 👋 Welcome to MLRIT Smart Campus Assistant. How can I help?",
            "Hi there 😊 Ask me anything about academics, events, or campus life!",
            "Hello! 🎓 Ready when you are — what's up?",
        ]

        # ==========================
        # FAREWELLS
        # ==========================
        self.farewell_patterns = [
            r'\b(bye+|good\s*bye|see\s*ya|cya|later|ttyl|gn|good\s*night)\b',
            r'^(bye|bai)[\s!?.]*$',
        ]

        self.farewell_responses = [
            "Bye 👋 Take care and all the best!",
            "See you! 🎓 Come back anytime.",
            "Good luck! Catch you later 😄",
        ]

        # ==========================
        # THANKS
        # ==========================
        self.thanks_patterns = [
            r'\b(thanks+|thank\s*you|thx|ty|appreciate\s*it)\b',
        ]

        self.thanks_responses = [
            "You got it 😄 Anything else?",
            "Happy to help 👍",
            "Anytime! 🚀",
        ]

        # ==========================
        # ACK / OK / YES
        # ==========================
        self.ack_patterns = [
            r'^(ok|okay|cool|fine|alright|sure|got\s*it|hmm+|yep|yeah|ya)$',
            r'\b(makes\s*sense|sounds\s*good)\b',
        ]

        self.ack_responses = [
            "Cool 😄 What's next?",
            "Alright 👍 Ask away.",
            "Got it! I'm here.",
        ]

        # ==========================
        # CONFUSION
        # ==========================
        self.confusion_patterns = [
            r'\b(i\s*don\'?t\s*understand|confused|didn\'?t\s*get)\b',
            r'\b(explain\s*again|simplify|break\s*it\s*down)\b',
        ]

        self.confusion_responses = [
            "No stress 🙂 Tell me what part confused you.",
            "Gotcha. Want a simpler explanation?",
            "All good — let's go step by step.",
        ]

        # ==========================
        # PRAISE
        # ==========================
        self.praise_patterns = [
            r'\b(nice|awesome|great|good\s*job|well\s*done)\b',
            r'\b(you(\'?re)?\s*(smart|helpful|amazing))\b',
        ]

        self.praise_responses = [
            "Appreciate it 😄 Let's keep going!",
            "Thanks! Always here to help 🎓",
            "Means a lot 🚀",
        ]

        # ==========================
        # HOW ARE YOU
        # ==========================
        self.howru_patterns = [
            r'\b(how\s*(are|r)\s*(you|u)|how\'?s\s*it\s*going)\b',
        ]

        self.howru_responses = [
            "Doing great 😄 How can I help?",
            "All good here! What do you need?",
        ]

        # ==========================
        # HELP
        # ==========================
        self.help_patterns = [
            r'^(help|help\s*me)$',
            r'\b(what\s*can\s*you\s*do|your\s*capabilities)\b',
        ]

        self.help_responses = [
            """I'm the MLRIT Smart Campus Assistant 🎓

I can help you with:
📚 Academics & Departments  
🏆 Placements & Companies  
🎉 Events & Clubs  
🏛️ Campus Facilities  
👨‍🏫 Faculty Info  
🎓 Scholarships  

Ask me anything about MLRIT!"""
        ]

        # ==========================
        # BOT IDENTITY
        # ==========================
        self.identity_patterns = [
            r'\b(who\s*are\s*you|what\s*are\s*you)\b',
            r'\b(are\s*you\s*a\s*bot)\b',
        ]

        self.identity_responses = [
            "I'm a campus assistant 🤖🎓 Built to help MLRIT students fast.",
            "Not human — but very campus-smart 😄",
        ]

        # ==========================
        # MOOD
        # ==========================
        self.mood_patterns = [
            r'\b(i\'?m\s*(bored|tired|stressed|sad|happy))\b',
        ]

        self.mood_responses = [
            "College life hits hard 😅 Want some campus info?",
            "Hang in there 💪 How can I help?",
        ]

        # ==========================
        # TIME
        # ==========================
        self.time_patterns = [
            r'\b(time\s*now|current\s*time|what\s*time)\b',
        ]

        self._compile_patterns()

    # ==========================
    # UTILITIES
    # ==========================
    def _compile_patterns(self):
        for attr in dir(self):
            if attr.endswith("_patterns") and not attr.startswith("compiled_"):
                value = getattr(self, attr)
                if isinstance(value, list):
                    compiled = [re.compile(p, re.IGNORECASE) for p in value]
                    setattr(self, f"compiled_{attr}", compiled)

    def _match(self, text: str, patterns: List[re.Pattern]) -> bool:
        return any(p.search(text) for p in patterns)

    def _simple(self, text: str) -> bool:
        return len(text.split()) <= 5

    def _time_response(self) -> str:
        return f"It's {datetime.now().strftime('%I:%M %p')} ⏰"

    # ==========================
    # MAIN LOGIC
    # ==========================
    def detect_intent(self, message: str) -> Optional[Dict[str, Any]]:
        msg = message.strip()
        if not msg:
            return None

        simple = self._simple(msg)

        checks = [
            ("help", self.compiled_help_patterns, self.help_responses),
            ("ack", self.compiled_ack_patterns, self.ack_responses),
            ("confusion", self.compiled_confusion_patterns, self.confusion_responses),
            ("praise", self.compiled_praise_patterns, self.praise_responses),
            ("identity", self.compiled_identity_patterns, self.identity_responses),
            ("time", self.compiled_time_patterns, None),
            ("howru", self.compiled_howru_patterns, self.howru_responses),
            ("thanks", self.compiled_thanks_patterns, self.thanks_responses),
            ("greeting", self.compiled_greeting_patterns, self.greeting_responses),
            ("farewell", self.compiled_farewell_patterns, self.farewell_responses),
            ("mood", self.compiled_mood_patterns, self.mood_responses),
        ]

        for name, patterns, responses in checks:
            if self._match(msg, patterns) and (simple or name not in ["greeting", "farewell"]):
                logger.info(f"🎯 Intent detected: {name}")
                return {
                    "intent": name,
                    "response": self._time_response() if name == "time" else random.choice(responses),
                    "handled": True,
                }

        return None

    def handle_message(self, message: str) -> Tuple[bool, Optional[str]]:
        result = self.detect_intent(message)
        if result:
            return True, result["response"]
        return False, None


# Global instance
intent_handler = IntentHandler()
