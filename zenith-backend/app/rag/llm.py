"""
LLM Service - Google Gemini Integration
"""
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class LLMService:
    """Service for LLM interactions using Google Gemini"""
    
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        
        # Configure Gemini API
        genai.configure(api_key=settings.GEMINI_API_KEY)
        # Use gemini-1.5-flash-latest (correct model name for API v1beta)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        logger.info(f"✅ Initialized LLM Service with Google Gemini")
        logger.info(f"Model: gemini-1.5-flash-latest (1500 requests/day free tier)")
    
    def generate_response(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> str:
        """
        Generate response from Google Gemini
        
        Args:
            prompt: User prompt
            system_prompt: Optional system instruction
            temperature: Creativity (0-1)
            max_tokens: Max response length
        
        Returns:
            Generated text
        """
        try:
            # Combine system prompt and user prompt
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"
            
            # Configure generation settings
            generation_config = genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            )
            
            # Generate response
            response = self.model.generate_content(
                full_prompt,
                generation_config=generation_config
            )
            
            # Handle response safely - NEVER use response.text directly
            if response.candidates and len(response.candidates) > 0:
                candidate = response.candidates[0]
                if candidate.content and candidate.content.parts:
                    # Extract text from parts
                    text_parts = [part.text for part in candidate.content.parts if hasattr(part, 'text')]
                    result = ' '.join(text_parts).strip()
                    if result:
                        return result
            
            # If no valid response, return empty string
            logger.warning("Gemini returned empty response")
            return ""
            
        except Exception as e:
            logger.error(f"Error generating Gemini response: {str(e)}")
            raise Exception(f"Failed to get response from Gemini: {str(e)}")
    
    def generate_rag_response(
        self,
        question: str,
        context_chunks: List[str],
        max_tokens: int = 1000
    ) -> str:
        """
        Generate response using RAG (Retrieved context)
        
        Args:
            question: User question
            context_chunks: Retrieved context from vector DB
            max_tokens: Max response length
        
        Returns:
            Generated answer
        """
        # Build context
        context = "\n\n".join([f"[Source {i+1}] {chunk}" for i, chunk in enumerate(context_chunks)])
        
        # Enhanced system prompt - Helpful campus assistant
        system_prompt = """You are a Smart Campus Assistant helping students with campus-related information.

YOUR ROLE:
- Answer questions about campus life, events, placements, and activities
- Provide accurate information from the knowledge base
- Help students with event details, placement statistics, internships, clubs, and scholarships
- Be friendly, helpful, and informative

GUIDELINES:
1. USE the provided context to answer questions accurately
2. Trust the context and answer based on it
3. Cite sources when helpful: [Source 1], [Source 2]
4. If context is insufficient, say: "I don't have enough information about that in my knowledge base."
5. For questions clearly unrelated to campus/education, politely say: "I'm designed to help with campus information."
6. Be conversational and student-friendly
7. Provide specific details (dates, names, locations) from the context

Remember: The context documents are from the campus knowledge base. Answer confidently using that information!"""
        
        # Build prompt
        prompt = f"""Context from Knowledge Base:
{context}

Student Question: {question}

Please provide a helpful answer based ONLY on the context above. Stay focused on campus information."""
        
        return self.generate_response(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.3,  # Lower temperature for factual, focused answers
            max_tokens=max_tokens
        )
    
    def format_retrieved_content(
        self,
        question: str,
        retrieved_texts: List[str],
        sources_metadata: List[Dict[str, Any]],
        conversation_history: List[Dict[str, str]] = None
    ) -> str:
        """
        Format retrieved content from database into a neat, readable response
        
        Args:
            question: Original user question
            retrieved_texts: Raw text chunks from vector database
            sources_metadata: Metadata about each source (score, namespace, etc.)
            conversation_history: Previous conversation messages for context (optional)
        
        Returns:
            Beautifully formatted response
        """
        # Build context with metadata
        context_parts = []
        for i, (text, meta) in enumerate(zip(retrieved_texts, sources_metadata), 1):
            score = meta.get('score', 0)
            namespace = meta.get('namespace', 'general')
            context_parts.append(f"[Document {i}] (Relevance: {score*100:.1f}% | Category: {namespace})\n{text}")
        
        context = "\n\n".join(context_parts)
        
        # Build conversation history context if available
        history_context = ""
        if conversation_history:
            history_parts = []
            for msg in conversation_history[-5:]:  # Last 5 messages for context
                role = "Student" if msg.get('role') == 'user' else "Assistant"
                content = msg.get('content', '')
                history_parts.append(f"{role}: {content}")
            history_context = "Previous Conversation:\n" + "\n".join(history_parts) + "\n\n"
        
        # System prompt for formatting
        system_prompt = """You are the Smart Campus Assistant for MLRIT college - friendly, helpful, and knowledgeable.

YOUR MISSION:
Answer student questions naturally using the retrieved documents. Be conversational, not robotic.

HOW TO ANSWER:
1. READ the documents and extract relevant facts
2. ANSWER in your own words - don't copy-paste document text
3. Be CONCISE - give 2-5 sentences for simple questions
4. Include specific details (names, dates, numbers) when relevant
5. NEVER mention "document numbers" or "relevance scores" - just answer naturally
6. NEVER say "according to the document" or "based on the retrieved text"
7. If conversation history exists, use it to understand context

RELEVANCE CHECK:
- If ALL documents have relevance below 30% AND don't answer the question:
  Say: "I don't have that information in my knowledge base. You can ask me about MLRIT's programs, placements, events, facilities, or contact details."

EXAMPLES OF GOOD ANSWERS:

Question: "Who founded MLRIT?"
Bad: "Document 1 states that MLRIT was founded by..."
Good: "MLRIT was founded in 2005 by Sri Marri Laxman Reddy under the KMR Educational Trust."

Question: "What programs are offered?"
Bad: "The retrieved documents list the following..."
Good: "MLRIT offers B.Tech programs in Computer Science (including AI/ML, Data Science, Cyber Security), Electronics, Electrical, Mechanical, and Aeronautical Engineering. They also have M.Tech and MBA programs."

Question: "Library facilities?"
Bad: "According to Document 2..."
Good: "The campus has a central library with physical books, e-resources, NPTEL access, and online journal subscriptions including IEEE and Elsevier."

BE NATURAL, FRIENDLY, AND HELPFUL!"""
        
        # Simplify the context - don't show metadata to Gemini
        simple_context_parts = []
        for i, text in enumerate(retrieved_texts, 1):
            simple_context_parts.append(f"Source {i}:\n{text}")
        
        simple_context = "\n\n".join(simple_context_parts)
        
        prompt = f"""{history_context}Retrieved Information:
{simple_context}

Student Question: {question}

Answer naturally and concisely."""
        
        return self.generate_response(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.3,  # Lower for more focused answers
            max_tokens=500  # Shorter answers (2-5 sentences)
        )
    
    def detect_category(self, question: str) -> str:
        """
        Detect the category of a user question using Gemini
        Extracts key topics to match against dynamic categories
        
        Args:
            question: User's question
            
        Returns:
            Category keyword or "general"
        """
        system_prompt = """You are a category detector for an MLRIT college chatbot.

Your task: Extract the main topic/subject from the question as a single keyword.

Examples:
- "Who is the chairman?" → chairman
- "Tell me about the principal" → principal  
- "What events are happening?" → events
- "Sports achievements" → sports
- "Campus facilities" → campus
- "About the college" → about
- "Faculty information" → faculty
- "Placement details" → placements

Return ONLY ONE keyword (lowercase, no spaces). If unclear, return "general"."""

        prompt = f"""Question: "{question}"

Keyword:"""

        try:
            response = self.generate_response(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.1,  # Low temperature for consistent classification
                max_tokens=10
            )
            
            category = response.strip().lower().replace(' ', '_')
            
            logger.info(f"🎯 Detected category: {category} for question: '{question[:50]}...'")
            return category if category else "general"
                
        except Exception as e:
            logger.error(f"❌ Error detecting category: {e}")
            return "general"


# Global instance
llm_service = LLMService()
