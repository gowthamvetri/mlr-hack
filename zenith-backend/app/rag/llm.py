"""
LLM Service - Local LM Studio Integration
Uses OpenAI-compatible API to connect to local LLM
"""
from typing import List, Dict, Any, Optional
from openai import OpenAI
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class LLMService:
    """Service for LLM interactions using Local LM Studio"""
    
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        
        # Configure OpenAI-compatible client for LM Studio
        self.client = OpenAI(
            base_url=settings.LM_STUDIO_BASE_URL,
            api_key="lm-studio"  # LM Studio doesn't require real API key
        )
        self.model = settings.LM_STUDIO_MODEL
        
        logger.info(f"✅ Initialized LLM Service with Local LM Studio")
        logger.info(f"Model: {self.model} at {settings.LM_STUDIO_BASE_URL}")
    
    def generate_response(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> str:
        """
        Generate response from Local LM Studio
        
        Args:
            prompt: User prompt
            system_prompt: Optional system instruction
            temperature: Creativity (0-1)
            max_tokens: Max response length
        
        Returns:
            Generated text
        """
        try:
            # Build messages
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            # Generate response using OpenAI-compatible API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            # Extract response
            if response.choices and len(response.choices) > 0:
                result = response.choices[0].message.content.strip()
                if result:
                    return result
            
            logger.warning("LM Studio returned empty response")
            return ""
            
        except Exception as e:
            logger.error(f"Error generating LM Studio response: {str(e)}")
            raise Exception(f"Failed to get response from LM Studio: {str(e)}")
    
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
        
        # SIMPLIFIED system prompt for clean, accurate responses
        system_prompt = """You are the MLRIT Campus Assistant. Answer questions about MLR Institute of Technology.

IMPORTANT RULES:
1. USE the retrieved documents to answer - they contain relevant MLRIT information
2. If the documents contain related info, share it helpfully
3. For person-specific questions (principal/chairman), answer about THAT person only
4. Don't say "I don't have info" if there IS related content in the documents
5. For non-MLRIT questions, say "I only answer MLRIT-related queries"

WHEN TO SAY "I don't have that info":
- ONLY if the retrieved documents have NO relevant information at all
- If documents have RELATED info, share what you have

FORMAT:
- Use **bold** for names and important terms
- Use *italics* for titles/designations  
- Keep answers concise but informative
- Only show contact info if it exists"""
        
        # Simplify the context
        simple_context = "\n\n".join([f"[{i+1}] {text}" for i, text in enumerate(retrieved_texts)])
        
        prompt = f"""Retrieved Information about MLRIT:
{simple_context}

Question: {question}

Instructions: Answer the question using the information above. If the exact answer isn't available but related info exists, share what's available. Be helpful and informative. Use **bold** for important terms."""
        
        return self.generate_response(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.3,  # Slightly higher for more natural responses
            max_tokens=500
        )
    
    def detect_category(self, question: str) -> str:
        """
        Detect the category of a user question using LLM
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
